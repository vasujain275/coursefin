// ============================================================================
// Course Service - CourseFin
// ============================================================================
// Purpose: Business logic for course import and management
// Pattern: Service layer using repository for database operations
// Usage: Called by Wails app bindings for course operations
// ============================================================================

package course

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coursefin/internal/sqlc"
)

// Service handles course business logic
type Service struct {
	queries sqlc.Querier
}

// NewService creates a new course service
func NewService(queries sqlc.Querier) *Service {
	return &Service{
		queries: queries,
	}
}

// ImportCourseResult contains the result of a course import
type ImportCourseResult struct {
	CourseID      int64  `json:"courseId"`
	Title         string `json:"title"`
	TotalSections int    `json:"totalSections"`
	TotalLectures int    `json:"totalLectures"`
	TotalDuration int64  `json:"totalDuration"`
	AlreadyExists bool   `json:"alreadyExists"`
}

// ScanLibraryResult contains the aggregate result of a library scan
type ScanLibraryResult struct {
	CoursesAdded   int      `json:"coursesAdded"`
	CoursesSkipped int      `json:"coursesSkipped"` // already existed in DB
	Errors         []string `json:"errors"`         // non-fatal per-folder errors
}

// ScanLibrary scans all top-level subfolders of coursesDir and imports each one as a course.
// Already-imported courses are skipped. Non-fatal per-folder errors are collected and returned
// in the result rather than aborting the whole scan.
func (s *Service) ScanLibrary(ctx context.Context, coursesDir string) (*ScanLibraryResult, error) {
	// Validate courses directory
	info, err := os.Stat(coursesDir)
	if err != nil {
		return nil, fmt.Errorf("courses directory not accessible: %w", err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("courses directory is not a directory: %s", coursesDir)
	}

	// List all entries in the courses directory
	entries, err := os.ReadDir(coursesDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read courses directory: %w", err)
	}

	result := &ScanLibraryResult{
		Errors: []string{},
	}

	for _, entry := range entries {
		// Only process top-level subdirectories
		if !entry.IsDir() {
			continue
		}

		// Skip hidden directories (e.g. .git, .DS_Store)
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		coursePath := filepath.Join(coursesDir, entry.Name())

		// Attempt to import the course
		importResult, err := s.ImportCourse(ctx, coursePath, coursesDir)
		if err != nil {
			// Non-fatal: collect error and continue scanning other folders
			result.Errors = append(result.Errors,
				fmt.Sprintf("%s: %v", entry.Name(), err))
			continue
		}

		if importResult.AlreadyExists {
			result.CoursesSkipped++
		} else {
			result.CoursesAdded++
		}
	}

	return result, nil
}

// ImportCourse scans and imports a course from a folder path.
// If the course already exists, it performs a SMART SYNC:
//   - Re-scans the filesystem for any new/missing lectures
//   - Inserts missing sections and lectures without touching existing ones
//   - Preserves all existing progress data
//
// coursePath: absolute path to course folder
// coursesDir: absolute path to courses library root directory (used for scanning)
func (s *Service) ImportCourse(ctx context.Context, coursePath string, coursesDir string) (*ImportCourseResult, error) {
	// Scan course folder for metadata (always do this, even for existing courses)
	metadata, err := ScanCourseFolder(coursePath, coursesDir)
	if err != nil {
		return nil, fmt.Errorf("failed to scan course folder: %w", err)
	}

	// Helper functions
	strPtr := func(s string) *string {
		if s == "" {
			return nil
		}
		return &s
	}
	int64Ptr := func(i int64) *int64 { return &i }

	// Check if course already exists (using absolute path)
	existingCourse, err := s.queries.GetCourseByPath(ctx, coursePath)
	if err == nil && existingCourse != nil {
		// ── Smart Sync: course exists, add missing sections/lectures ──
		return s.syncExistingCourse(ctx, existingCourse, metadata, int64Ptr)
	}

	// ── Fresh Import: course doesn't exist yet ──

	// Calculate totals
	var totalDuration int64
	var totalLectures int
	for _, section := range metadata.Sections {
		for _, lecture := range section.Lectures {
			totalDuration += lecture.Duration
			totalLectures++
		}
	}

	slug := generateSlug(metadata.Title)

	course, err := s.queries.CreateCourse(ctx, sqlc.CreateCourseParams{
		Title:          metadata.Title,
		Slug:           slug,
		Description:    nil,
		InstructorName: nil,
		ThumbnailUrl:   strPtr(metadata.ThumbnailURL),
		ThumbnailPath:  nil,
		CoursePath:     coursePath,
		TotalDuration:  int64Ptr(totalDuration),
		TotalLectures:  int64Ptr(int64(totalLectures)),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create course: %w", err)
	}

	// Import all sections and lectures
	for _, sectionMeta := range metadata.Sections {
		section, err := s.queries.CreateSection(ctx, sqlc.CreateSectionParams{
			CourseID:      course.ID,
			Title:         sectionMeta.Title,
			SectionNumber: int64(sectionMeta.SectionNumber),
			Description:   nil,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create section %s: %w", sectionMeta.Title, err)
		}

		for _, lectureMeta := range sectionMeta.Lectures {
			isQuiz := false
			isDownloadable := true
			hasSubtitles := len(lectureMeta.SubtitlePaths) > 0
			originalFilename := filepath.Base(lectureMeta.VideoPath)

			lecture, err := s.queries.CreateLecture(ctx, sqlc.CreateLectureParams{
				SectionID:        section.ID,
				CourseID:         course.ID,
				Title:            lectureMeta.Title,
				LectureNumber:    int64(lectureMeta.LectureNumber),
				LectureType:      lectureMeta.LectureType,
				IsQuiz:           &isQuiz,
				IsDownloadable:   &isDownloadable,
				FilePath:         lectureMeta.VideoPath,
				OriginalFilename: &originalFilename,
				ResourcesPath:    nil,
				FileSize:         nil,
				Duration:         int64Ptr(lectureMeta.Duration),
				VideoCodec:       nil,
				Resolution:       nil,
				HasSubtitles:     &hasSubtitles,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to create lecture %s: %w", lectureMeta.Title, err)
			}

			for _, subtitlePath := range lectureMeta.SubtitlePaths {
				language := detectSubtitleLanguage(subtitlePath)
				format := detectSubtitleFormat(subtitlePath)
				_, err := s.queries.CreateSubtitle(ctx, sqlc.CreateSubtitleParams{
					LectureID: lecture.ID,
					Language:  language,
					Format:    format,
					FilePath:  subtitlePath,
				})
				if err != nil {
					return nil, fmt.Errorf("failed to create subtitle: %w", err)
				}
			}
		}
	}

	return &ImportCourseResult{
		CourseID:      course.ID,
		Title:         course.Title,
		TotalSections: len(metadata.Sections),
		TotalLectures: totalLectures,
		TotalDuration: totalDuration,
		AlreadyExists: false,
	}, nil
}

// syncExistingCourse re-scans an existing course and inserts any missing
// sections/lectures without touching existing data (preserves user progress).
func (s *Service) syncExistingCourse(
	ctx context.Context,
	course *sqlc.Course,
	metadata *CourseMetadata,
	int64Ptr func(int64) *int64,
) (*ImportCourseResult, error) {
	var addedLectures int

	for _, sectionMeta := range metadata.Sections {
		// Find or create section
		section, err := s.queries.GetSectionByCourseAndNumber(ctx, sqlc.GetSectionByCourseAndNumberParams{
			CourseID:      course.ID,
			SectionNumber: int64(sectionMeta.SectionNumber),
		})
		if err != nil {
			// Section doesn't exist — create it
			section, err = s.queries.CreateSection(ctx, sqlc.CreateSectionParams{
				CourseID:      course.ID,
				Title:         sectionMeta.Title,
				SectionNumber: int64(sectionMeta.SectionNumber),
				Description:   nil,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to create section %s: %w", sectionMeta.Title, err)
			}
			fmt.Printf("[Sync] Created new section: %s\n", sectionMeta.Title)
		}

		// Check each lecture
		for _, lectureMeta := range sectionMeta.Lectures {
			// Check if lecture already exists (by file_path + course_id)
			_, err := s.queries.GetLectureByFilePath(ctx, sqlc.GetLectureByFilePathParams{
				CourseID:  course.ID,
				FilePath:  lectureMeta.VideoPath,
			})
			if err == nil {
				// Lecture already exists — skip
				continue
			}

			// Lecture doesn't exist — create it
			isQuiz := false
			isDownloadable := true
			hasSubtitles := len(lectureMeta.SubtitlePaths) > 0
			originalFilename := filepath.Base(lectureMeta.VideoPath)

			lecture, err := s.queries.CreateLecture(ctx, sqlc.CreateLectureParams{
				SectionID:        section.ID,
				CourseID:         course.ID,
				Title:            lectureMeta.Title,
				LectureNumber:    int64(lectureMeta.LectureNumber),
				LectureType:      lectureMeta.LectureType,
				IsQuiz:           &isQuiz,
				IsDownloadable:   &isDownloadable,
				FilePath:         lectureMeta.VideoPath,
				OriginalFilename: &originalFilename,
				ResourcesPath:    nil,
				FileSize:         nil,
				Duration:         int64Ptr(lectureMeta.Duration),
				VideoCodec:       nil,
				Resolution:       nil,
				HasSubtitles:     &hasSubtitles,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to create lecture %s: %w", lectureMeta.Title, err)
			}

			fmt.Printf("[Sync] Added lecture: %s (type: %s)\n", lectureMeta.Title, lectureMeta.LectureType)
			addedLectures++

			// Import subtitles for new lectures
			for _, subtitlePath := range lectureMeta.SubtitlePaths {
				language := detectSubtitleLanguage(subtitlePath)
				format := detectSubtitleFormat(subtitlePath)
				_, err := s.queries.CreateSubtitle(ctx, sqlc.CreateSubtitleParams{
					LectureID: lecture.ID,
					Language:  language,
					Format:    format,
					FilePath:  subtitlePath,
				})
				if err != nil {
					fmt.Printf("[Sync] Warning: failed to create subtitle: %v\n", err)
				}
			}
		}
	}

	// Update course stats (total lectures/duration may have changed)
	var totalDuration int64
	var totalLectures int
	for _, section := range metadata.Sections {
		for _, lecture := range section.Lectures {
			totalDuration += lecture.Duration
			totalLectures++
		}
	}
	_ = s.queries.UpdateCourseStats(ctx, sqlc.UpdateCourseStatsParams{
		TotalDuration: int64Ptr(totalDuration),
		TotalLectures: int64Ptr(int64(totalLectures)),
		ID:            course.ID,
	})

	fmt.Printf("[Sync] Course sync complete: %s (%d new lectures added)\n", course.Title, addedLectures)

	return &ImportCourseResult{
		CourseID:      course.ID,
		Title:         course.Title,
		TotalSections: len(metadata.Sections),
		TotalLectures: totalLectures,
		TotalDuration: totalDuration,
		AlreadyExists: addedLectures == 0,
	}, nil
}

// GetAllCourses retrieves all courses (for library view)
func (s *Service) GetAllCourses(ctx context.Context) ([]*sqlc.Course, error) {
	// Get all courses (no pagination for Sprint 1)
	courses, err := s.queries.ListCourses(ctx, sqlc.ListCoursesParams{
		Limit:  1000, // Reasonable limit
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list courses: %w", err)
	}

	// Convert to pointers for consistency
	result := make([]*sqlc.Course, len(courses))
	for i := range courses {
		result[i] = courses[i]
	}

	return result, nil
}

// GetHtmlLectureContent reads an HTML lecture file from disk and returns its content.
// The frontend uses this with iframe srcdoc= to render HTML inline, avoiding
// cross-origin issues between the wails:// scheme and http://127.0.0.1.
func (s *Service) GetHtmlLectureContent(ctx context.Context, lectureID int64) (string, error) {
	lecture, err := s.queries.GetLectureByID(ctx, lectureID)
	if err != nil {
		return "", fmt.Errorf("lecture not found: %w", err)
	}

	course, err := s.queries.GetCourseByID(ctx, lecture.CourseID)
	if err != nil {
		return "", fmt.Errorf("course not found: %w", err)
	}

	absPath := filepath.Join(course.CoursePath, lecture.FilePath)
	content, err := os.ReadFile(absPath)
	if err != nil {
		return "", fmt.Errorf("failed to read HTML file %s: %w", absPath, err)
	}

	return string(content), nil
}

// GetCourseByID retrieves a single course by ID
func (s *Service) GetCourseByID(ctx context.Context, id int64) (*sqlc.Course, error) {
	course, err := s.queries.GetCourseByID(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("course not found: %d", id)
		}
		return nil, fmt.Errorf("failed to get course: %w", err)
	}
	return course, nil
}

// generateSlug creates a URL-friendly slug from a course title
// Example: "Ultimate AWS Certified Solutions Architect" → "ultimate-aws-certified-solutions-architect"
func generateSlug(title string) string {
	// Convert to lowercase
	slug := strings.ToLower(title)

	// Replace spaces and special characters with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")

	// Remove non-alphanumeric characters (except hyphens)
	var result strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}

	// Remove consecutive hyphens
	slug = result.String()
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}

	// Trim hyphens from edges
	slug = strings.Trim(slug, "-")

	return slug
}

// detectSubtitleLanguage extracts language code from subtitle filename
// Example: "1. Course Introduction.en_US.srt" → "en_US"
func detectSubtitleLanguage(subtitlePath string) string {
	basename := filepath.Base(subtitlePath)
	ext := filepath.Ext(basename)
	nameWithoutExt := strings.TrimSuffix(basename, ext)

	// Check for language code pattern (e.g., ".en_US" or ".en")
	parts := strings.Split(nameWithoutExt, ".")
	if len(parts) >= 2 {
		lastPart := parts[len(parts)-1]
		// Common language code patterns
		if len(lastPart) == 2 || strings.Contains(lastPart, "_") {
			return lastPart
		}
	}

	return "unknown"
}

// detectSubtitleFormat determines subtitle format from file extension
func detectSubtitleFormat(subtitlePath string) string {
	ext := strings.ToLower(filepath.Ext(subtitlePath))
	switch ext {
	case ".srt":
		return "srt"
	case ".vtt":
		return "vtt"
	case ".ass":
		return "ass"
	case ".ssa":
		return "ssa"
	default:
		return "unknown"
	}
}

// ============================================================================
// DTOs for nested course structure (with sections and lectures)
// ============================================================================

// CourseWithSections represents a course with all its sections and lectures
type CourseWithSections struct {
	*sqlc.Course
	Sections []*SectionWithLectures `json:"sections"`
}

// SectionWithLectures represents a section with all its lectures
type SectionWithLectures struct {
	*sqlc.Section
	Lectures []*sqlc.Lecture `json:"lectures"`
}

// GetCourseWithSections retrieves a course with all sections and lectures
func (s *Service) GetCourseWithSections(ctx context.Context, id int64) (*CourseWithSections, error) {
	// Get the course
	course, err := s.queries.GetCourseByID(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("course not found: %d", id)
		}
		return nil, fmt.Errorf("failed to get course: %w", err)
	}

	// Get all sections for the course
	sections, err := s.queries.ListSectionsByCourse(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get sections: %w", err)
	}

	// Build the nested structure
	sectionsWithLectures := make([]*SectionWithLectures, len(sections))
	for i, section := range sections {
		// Get lectures for this section
		lectures, err := s.queries.ListLecturesBySection(ctx, section.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get lectures for section %d: %w", section.ID, err)
		}

		sectionsWithLectures[i] = &SectionWithLectures{
			Section:  section,
			Lectures: lectures,
		}
	}

	return &CourseWithSections{
		Course:   course,
		Sections: sectionsWithLectures,
	}, nil
}

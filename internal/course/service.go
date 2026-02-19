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
	"path/filepath"
	"strings"

	"coursefin/internal/sqlc"
)

// Service handles course business logic
type Service struct {
	queries *sqlc.Queries
}

// NewService creates a new course service
func NewService(queries *sqlc.Queries) *Service {
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

// ImportCourse scans and imports a course from a folder path
// coursePath: absolute path to course folder
// coursesDir: absolute path to courses library root directory
func (s *Service) ImportCourse(ctx context.Context, coursePath string, coursesDir string) (*ImportCourseResult, error) {
	// Calculate relative path for storage
	relativePath, err := filepath.Rel(coursesDir, coursePath)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate relative path: %w", err)
	}

	// Check if course already exists
	existingCourse, err := s.queries.GetCourseByPath(ctx, relativePath)
	if err == nil && existingCourse != nil {
		// Course already imported
		return &ImportCourseResult{
			CourseID:      existingCourse.ID,
			Title:         existingCourse.Title,
			AlreadyExists: true,
		}, nil
	}

	// Scan course folder for metadata
	metadata, err := ScanCourseFolder(coursePath, coursesDir)
	if err != nil {
		return nil, fmt.Errorf("failed to scan course folder: %w", err)
	}

	// Calculate total duration and lecture count
	var totalDuration int64
	var totalLectures int
	for _, section := range metadata.Sections {
		for _, lecture := range section.Lectures {
			totalDuration += lecture.Duration
			totalLectures++
		}
	}

	// Generate slug from title
	slug := generateSlug(metadata.Title)

	// Helper function to create string pointer
	strPtr := func(s string) *string {
		if s == "" {
			return nil
		}
		return &s
	}

	// Helper for int64 pointer
	int64Ptr := func(i int64) *int64 { return &i }

	platform := "udemy"

	// Create course record
	course, err := s.queries.CreateCourse(ctx, sqlc.CreateCourseParams{
		Title:            metadata.Title,
		Slug:             slug,
		Description:      nil,
		InstructorName:   nil,
		InstructorBio:    nil,
		ThumbnailUrl:     strPtr(metadata.ThumbnailURL),
		ThumbnailPath:    nil,
		LocalPosterPath:  nil,
		UdemyUrl:         nil,
		Platform:         &platform,
		CoursePath:       relativePath,
		TotalDuration:    int64Ptr(totalDuration),
		TotalLectures:    int64Ptr(int64(totalLectures)),
		Rating:           nil,
		EnrolledStudents: nil,
		Language:         nil,
		Category:         nil,
		Subcategory:      nil,
		Level:            nil,
		LastUpdated:      nil,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create course: %w", err)
	}

	// Import sections and lectures
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

		// Import lectures for this section
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
				LectureType:      "video",
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

			// Import subtitles for this lecture
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

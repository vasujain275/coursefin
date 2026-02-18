// Package player provides video serving and playback control functionality
package player

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"coursefin/internal/database"
	"coursefin/internal/sqlc"
)

// Service provides player-related business logic
type Service struct {
	db         *database.DB
	coursesDir string
}

// NewService creates a new player service
func NewService(db *database.DB, coursesDir string) *Service {
	return &Service{
		db:         db,
		coursesDir: coursesDir,
	}
}

// GetVideoURL generates the URL for a video lecture
// Returns the relative path that can be used with the video handler
func (s *Service) GetVideoURL(ctx context.Context, lectureID int64) (string, error) {
	// Get lecture from database
	lecture, err := s.db.Queries().GetLectureByID(ctx, lectureID)
	if err != nil {
		return "", fmt.Errorf("failed to get lecture: %w", err)
	}

	// Get course to construct full path
	course, err := s.db.Queries().GetCourseByID(ctx, lecture.CourseID)
	if err != nil {
		return "", fmt.Errorf("failed to get course: %w", err)
	}

	// Construct video URL path
	// Format: /videos/{course_path}/{lecture_file_path}
	relativePath := filepath.Join(course.CoursePath, lecture.FilePath)
	videoURL := "/videos/" + relativePath

	return videoURL, nil
}

// GetSubtitleURL generates the URL for a subtitle file
// Returns empty string if no subtitle exists
func (s *Service) GetSubtitleURL(ctx context.Context, lectureID int64) (string, error) {
	// Get lecture from database
	lecture, err := s.db.Queries().GetLectureByID(ctx, lectureID)
	if err != nil {
		return "", fmt.Errorf("failed to get lecture: %w", err)
	}

	// Check if lecture has subtitles
	if lecture.HasSubtitles == nil || !*lecture.HasSubtitles {
		return "", nil // No subtitles available
	}

	// Get course to construct full path
	course, err := s.db.Queries().GetCourseByID(ctx, lecture.CourseID)
	if err != nil {
		return "", fmt.Errorf("failed to get course: %w", err)
	}

	// Query subtitle from subtitles table (prefer English)
	subtitles, err := s.db.Queries().ListSubtitlesByLecture(ctx, lectureID)
	if err != nil || len(subtitles) == 0 {
		// Try to find subtitle file by common naming conventions
		// Look for files with same name as video but with .srt or .vtt extension
		videoPath := lecture.FilePath
		basePathWithoutExt := videoPath[:len(videoPath)-len(filepath.Ext(videoPath))]

		// Try .vtt first, then .srt
		for _, ext := range []string{".vtt", ".srt"} {
			subtitlePath := basePathWithoutExt + ext
			relativePath := filepath.Join(course.CoursePath, subtitlePath)
			return "/subtitles/" + relativePath, nil
		}

		return "", nil
	}

	// Use the first subtitle (or prefer English if multiple)
	var selectedSubtitle *sqlc.Subtitle
	for _, subtitle := range subtitles {
		if subtitle.Language == "en" || subtitle.Language == "en_US" {
			selectedSubtitle = subtitle
			break
		}
	}
	if selectedSubtitle == nil && len(subtitles) > 0 {
		selectedSubtitle = subtitles[0]
	}

	if selectedSubtitle == nil {
		return "", nil
	}

	relativePath := filepath.Join(course.CoursePath, selectedSubtitle.FilePath)
	return "/subtitles/" + relativePath, nil
}

// UpdatePlaybackProgress updates the playback progress for a lecture
// This is called from the frontend player's timeupdate event
func (s *Service) UpdatePlaybackProgress(ctx context.Context, lectureID int64, position float64, duration float64) error {
	// Get lecture to find course_id
	lecture, err := s.db.Queries().GetLectureByID(ctx, lectureID)
	if err != nil {
		return fmt.Errorf("failed to get lecture: %w", err)
	}

	// Calculate if lecture should be marked as complete
	// Default threshold is 90% (can be made configurable later)
	completionThreshold := 0.90
	completed := (position / duration) >= completionThreshold

	// Prepare progress data
	watchedDuration := int64(position)
	totalDuration := int64(duration)
	lastPosition := int64(position)
	now := time.Now()

	// Upsert progress record
	_, err = s.db.Queries().UpsertProgress(ctx, sqlc.UpsertProgressParams{
		LectureID:       lectureID,
		CourseID:        lecture.CourseID,
		WatchedDuration: &watchedDuration,
		TotalDuration:   &totalDuration,
		LastPosition:    &lastPosition,
		Completed:       &completed,
		LastWatchedAt:   &now,
	})

	if err != nil {
		return fmt.Errorf("failed to update progress: %w", err)
	}

	return nil
}

// GetResumePosition returns the last playback position for a lecture
// Returns 0 if no progress exists or lecture was completed
func (s *Service) GetResumePosition(ctx context.Context, lectureID int64) (float64, error) {
	progress, err := s.db.Queries().GetProgressByLecture(ctx, lectureID)
	if err != nil {
		// No progress record exists, start from beginning
		return 0, nil
	}

	// If completed, start from beginning
	if progress.Completed != nil && *progress.Completed {
		return 0, nil
	}

	// Return last position in seconds
	if progress.LastPosition != nil {
		return float64(*progress.LastPosition), nil
	}

	return 0, nil
}

// StartWatchSession marks the beginning of a watch session
// This increments watch count and sets first_watched_at if needed
func (s *Service) StartWatchSession(ctx context.Context, lectureID int64) error {
	// Get lecture to find course_id
	lecture, err := s.db.Queries().GetLectureByID(ctx, lectureID)
	if err != nil {
		return fmt.Errorf("failed to get lecture: %w", err)
	}

	// Check if progress record exists
	progress, err := s.db.Queries().GetProgressByLecture(ctx, lectureID)
	if err != nil {
		// No progress record exists, create one
		now := time.Now()
		completed := false
		watchCount := int64(1)
		watchedDuration := int64(0)
		lastPosition := int64(0)

		_, err = s.db.Queries().CreateProgress(ctx, sqlc.CreateProgressParams{
			LectureID:       lectureID,
			CourseID:        lecture.CourseID,
			WatchedDuration: &watchedDuration,
			TotalDuration:   lecture.Duration,
			LastPosition:    &lastPosition,
			Completed:       &completed,
			WatchCount:      &watchCount,
			FirstWatchedAt:  &now,
			LastWatchedAt:   &now,
		})
		return err
	}

	// Progress record exists, increment watch count
	if progress.FirstWatchedAt == nil {
		// This shouldn't happen, but set it if missing
		now := time.Now()
		progress.FirstWatchedAt = &now
	}

	return s.db.Queries().IncrementWatchCount(ctx, lectureID)
}

// GetLectureInfo returns lecture information needed for the player
type LectureInfo struct {
	LectureID   int64
	Title       string
	VideoURL    string
	SubtitleURL string
	Duration    int64
	ResumeAt    float64
	HasNext     bool
	HasPrevious bool
	NextID      *int64
	PreviousID  *int64
}

// GetLectureInfo retrieves all information needed to play a lecture
func (s *Service) GetLectureInfo(ctx context.Context, lectureID int64) (*LectureInfo, error) {
	// Get lecture
	lecture, err := s.db.Queries().GetLectureByID(ctx, lectureID)
	if err != nil {
		return nil, fmt.Errorf("failed to get lecture: %w", err)
	}

	// Get video URL
	videoURL, err := s.GetVideoURL(ctx, lectureID)
	if err != nil {
		return nil, fmt.Errorf("failed to get video URL: %w", err)
	}

	// Get subtitle URL (may be empty)
	subtitleURL, _ := s.GetSubtitleURL(ctx, lectureID)

	// Get resume position
	resumeAt, _ := s.GetResumePosition(ctx, lectureID)

	// Get next and previous lecture IDs
	nextID, _ := s.getNextLectureID(ctx, *lecture)
	prevID, _ := s.getPreviousLectureID(ctx, *lecture)

	info := &LectureInfo{
		LectureID:   lectureID,
		Title:       lecture.Title,
		VideoURL:    videoURL,
		SubtitleURL: subtitleURL,
		Duration:    *lecture.Duration,
		ResumeAt:    resumeAt,
		HasNext:     nextID != nil,
		HasPrevious: prevID != nil,
		NextID:      nextID,
		PreviousID:  prevID,
	}

	return info, nil
}

// getNextLectureID finds the next lecture in sequence
func (s *Service) getNextLectureID(ctx context.Context, currentLecture sqlc.Lecture) (*int64, error) {
	// Get all lectures in the same section, ordered by lecture number
	lectures, err := s.db.Queries().ListLecturesBySection(ctx, currentLecture.SectionID)
	if err != nil {
		return nil, err
	}

	// Find current lecture and return next one
	for i, lecture := range lectures {
		if lecture.ID == currentLecture.ID && i+1 < len(lectures) {
			nextID := lectures[i+1].ID
			return &nextID, nil
		}
	}

	// No next lecture in this section, try first lecture of next section
	sections, err := s.db.Queries().ListSectionsByCourse(ctx, currentLecture.CourseID)
	if err != nil {
		return nil, err
	}

	// Find current section and get next section
	for i, section := range sections {
		if section.ID == currentLecture.SectionID && i+1 < len(sections) {
			nextSectionLectures, err := s.db.Queries().ListLecturesBySection(ctx, sections[i+1].ID)
			if err == nil && len(nextSectionLectures) > 0 {
				nextID := nextSectionLectures[0].ID
				return &nextID, nil
			}
		}
	}

	return nil, nil // No next lecture
}

// getPreviousLectureID finds the previous lecture in sequence
func (s *Service) getPreviousLectureID(ctx context.Context, currentLecture sqlc.Lecture) (*int64, error) {
	// Get all lectures in the same section, ordered by lecture number
	lectures, err := s.db.Queries().ListLecturesBySection(ctx, currentLecture.SectionID)
	if err != nil {
		return nil, err
	}

	// Find current lecture and return previous one
	for i, lecture := range lectures {
		if lecture.ID == currentLecture.ID && i > 0 {
			prevID := lectures[i-1].ID
			return &prevID, nil
		}
	}

	// No previous lecture in this section, try last lecture of previous section
	sections, err := s.db.Queries().ListSectionsByCourse(ctx, currentLecture.CourseID)
	if err != nil {
		return nil, err
	}

	// Find current section and get previous section
	for i, section := range sections {
		if section.ID == currentLecture.SectionID && i > 0 {
			prevSectionLectures, err := s.db.Queries().ListLecturesBySection(ctx, sections[i-1].ID)
			if err == nil && len(prevSectionLectures) > 0 {
				prevID := prevSectionLectures[len(prevSectionLectures)-1].ID
				return &prevID, nil
			}
		}
	}

	return nil, nil // No previous lecture
}

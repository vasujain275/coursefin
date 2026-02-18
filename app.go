package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"coursefin/internal/database"
	"coursefin/internal/player"
	"coursefin/internal/progress"
	"coursefin/internal/sqlc"
)

// App struct
type App struct {
	ctx          context.Context
	db           *database.DB
	tracker      *progress.Tracker
	playerSvc    *player.Service
	videoHandler *player.VideoHandler
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize database
	dataDir, err := database.GetAppDataDir()
	if err != nil {
		fmt.Printf("Failed to get app data directory: %v\n", err)
		return
	}

	db, err := database.NewDB(dataDir)
	if err != nil {
		fmt.Printf("Failed to initialize database: %v\n", err)
		return
	}
	a.db = db
	fmt.Printf("Database initialized at: %s\n", db.DBPath())

	// Initialize progress tracker
	a.tracker = progress.NewTracker(db)
	fmt.Println("Progress tracker initialized")

	// Load completion threshold from settings
	threshold, err := a.db.Queries().GetAutoCompleteThreshold(ctx)
	if err == nil {
		// Convert string to float64
		var thresholdFloat float64
		fmt.Sscanf(threshold, "%f", &thresholdFloat)
		a.tracker.SetCompletionThreshold(thresholdFloat)
	}

	// Get courses directory from settings
	coursesDir, err := a.db.Queries().GetCoursesDirectory(ctx)
	if err != nil || coursesDir == "" {
		coursesDir = dataDir // Fallback to data directory
		fmt.Printf("Using default courses directory: %s\n", coursesDir)
	} else {
		fmt.Printf("Courses directory: %s\n", coursesDir)
	}

	// Initialize video handler
	a.videoHandler = player.NewVideoHandler(coursesDir)
	fmt.Println("Video handler initialized")

	// Initialize player service
	a.playerSvc = player.NewService(db, coursesDir)
	fmt.Println("Player service initialized")
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	if a.tracker != nil {
		fmt.Println("Stopping progress tracking...")
		a.tracker.StopTracking()
	}

	if a.db != nil {
		fmt.Println("Closing database connection...")
		a.db.Close()
	}
}

// ServeHTTP implements http.Handler interface for custom asset serving
// Routes video and subtitle requests to the video handler
func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// Check if this is a video or subtitle request
	if strings.HasPrefix(path, "/videos/") || strings.HasPrefix(path, "/subtitles/") {
		if a.videoHandler != nil {
			a.videoHandler.ServeHTTP(w, r)
			return
		}
	}

	// For all other paths, return 404 (Wails will handle frontend assets separately)
	http.NotFound(w, r)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// =====================================
// Database Query Methods
// =====================================

// GetAllCourses returns all courses from the database
func (a *App) GetAllCourses() ([]interface{}, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	courses, err := a.db.Queries().ListCourses(a.ctx, sqlc.ListCoursesParams{
		Limit:  100, // Default to 100 courses
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list courses: %w", err)
	}

	// Convert to generic interface slice for frontend
	result := make([]interface{}, len(courses))
	for i, course := range courses {
		result[i] = course
	}

	return result, nil
}

// GetDatabasePath returns the path to the database file
func (a *App) GetDatabasePath() (string, error) {
	if a.db == nil {
		return "", fmt.Errorf("database not initialized")
	}
	return a.db.DBPath(), nil
}

// GetAppSettings returns all application settings as a map
func (a *App) GetAppSettings() (map[string]string, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	settings, err := a.db.Queries().ListAllSettings(a.ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get settings: %w", err)
	}

	result := make(map[string]string)
	for _, setting := range settings {
		result[setting.Key] = setting.Value
	}

	return result, nil
}

// =====================================
// Progress Tracking Methods
// =====================================

// StartTrackingProgress begins tracking playback progress for a lecture
func (a *App) StartTrackingProgress(lectureID int64) error {
	if a.tracker == nil {
		return fmt.Errorf("progress tracker not initialized")
	}
	return a.tracker.StartTracking(a.ctx, lectureID)
}

// StopTrackingProgress stops tracking the current lecture
func (a *App) StopTrackingProgress() error {
	if a.tracker == nil {
		return fmt.Errorf("progress tracker not initialized")
	}
	return a.tracker.StopTracking()
}

// GetResumePosition returns the last playback position for a lecture
func (a *App) GetResumePosition(lectureID int64) (float64, error) {
	if a.tracker == nil {
		return 0, fmt.Errorf("progress tracker not initialized")
	}
	return a.tracker.GetResumePosition(a.ctx, lectureID)
}

// GetLectureProgress returns progress information for a specific lecture
func (a *App) GetLectureProgress(lectureID int64) (*sqlc.Progress, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}
	return a.db.Queries().GetProgressByLecture(a.ctx, lectureID)
}

// IsTrackingProgress returns whether progress tracking is currently active
func (a *App) IsTrackingProgress() bool {
	if a.tracker == nil {
		return false
	}
	return a.tracker.IsTracking()
}

// =====================================
// Player Service Methods
// =====================================

// GetLectureForPlayer returns complete lecture info for video player
func (a *App) GetLectureForPlayer(lectureID int64) (*player.LectureInfo, error) {
	if a.playerSvc == nil {
		return nil, fmt.Errorf("player service not initialized")
	}
	return a.playerSvc.GetLectureInfo(a.ctx, lectureID)
}

// UpdateVideoProgress saves playback progress from frontend
func (a *App) UpdateVideoProgress(lectureID int64, position float64, duration float64) error {
	if a.playerSvc == nil {
		return fmt.Errorf("player service not initialized")
	}
	return a.playerSvc.UpdatePlaybackProgress(a.ctx, lectureID, position, duration)
}

// StartLectureWatch marks the start of a watch session
func (a *App) StartLectureWatch(lectureID int64) error {
	if a.playerSvc == nil {
		return fmt.Errorf("player service not initialized")
	}
	return a.playerSvc.StartWatchSession(a.ctx, lectureID)
}

// GetVideoResumePosition returns last position for resume
func (a *App) GetVideoResumePosition(lectureID int64) (float64, error) {
	if a.playerSvc == nil {
		return 0, fmt.Errorf("player service not initialized")
	}
	return a.playerSvc.GetResumePosition(a.ctx, lectureID)
}

package main

import (
	"context"
	"fmt"

	"coursefin/internal/database"
	"coursefin/internal/mpv"
	"coursefin/internal/progress"
	"coursefin/internal/sqlc"
)

// App struct
type App struct {
	ctx     context.Context
	player  *mpv.Player
	db      *database.DB
	tracker *progress.Tracker
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

	// Initialize MPV player
	player, err := mpv.NewPlayer()
	if err != nil {
		fmt.Printf("Failed to create MPV player: %v\n", err)
		return
	}
	a.player = player
	fmt.Println("MPV player initialized successfully")

	// Initialize progress tracker
	a.tracker = progress.NewTracker(db, player)
	fmt.Println("Progress tracker initialized")

	// Load completion threshold from settings
	threshold, err := a.db.Queries().GetAutoCompleteThreshold(ctx)
	if err == nil {
		// Convert string to float64
		var thresholdFloat float64
		fmt.Sscanf(threshold, "%f", &thresholdFloat)
		a.tracker.SetCompletionThreshold(thresholdFloat)
	}
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	if a.tracker != nil {
		fmt.Println("Stopping progress tracking...")
		a.tracker.StopTracking()
	}

	if a.player != nil {
		fmt.Println("Shutting down MPV player...")
		a.player.Close()
	}

	if a.db != nil {
		fmt.Println("Closing database connection...")
		a.db.Close()
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// =====================================
// MPV Player Control Methods
// =====================================

// PlayVideo starts playing a video file
func (a *App) PlayVideo(filePath string) error {
	if a.player == nil {
		return fmt.Errorf("player not initialized")
	}

	if !a.player.IsRunning() {
		return a.player.Start(filePath)
	}

	return a.player.LoadFile(filePath)
}

// PauseVideo pauses the current video
func (a *App) PauseVideo() error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.Pause()
}

// ResumeVideo resumes playback
func (a *App) ResumeVideo() error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.Play()
}

// TogglePauseVideo toggles play/pause
func (a *App) TogglePauseVideo() error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.TogglePause()
}

// SeekTo seeks to a specific position in seconds
func (a *App) SeekTo(seconds float64) error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.Seek(seconds)
}

// SeekRelative seeks relative to current position
func (a *App) SeekRelative(seconds float64) error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.SeekRelative(seconds)
}

// GetPlaybackPosition returns current position in seconds
func (a *App) GetPlaybackPosition() (float64, error) {
	if a.player == nil || !a.player.IsRunning() {
		return 0, fmt.Errorf("player not running")
	}
	return a.player.GetPosition()
}

// GetPlaybackDuration returns total duration in seconds
func (a *App) GetPlaybackDuration() (float64, error) {
	if a.player == nil || !a.player.IsRunning() {
		return 0, fmt.Errorf("player not running")
	}
	return a.player.GetDuration()
}

// SetVolume sets the volume (0-100)
func (a *App) SetVolume(volume float64) error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.SetVolume(volume)
}

// GetVolume returns current volume
func (a *App) GetVolume() (float64, error) {
	if a.player == nil || !a.player.IsRunning() {
		return 0, fmt.Errorf("player not running")
	}
	return a.player.GetVolume()
}

// SetPlaybackSpeed sets playback speed (1.0 = normal)
func (a *App) SetPlaybackSpeed(speed float64) error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.SetSpeed(speed)
}

// GetPlaybackSpeed returns current playback speed
func (a *App) GetPlaybackSpeed() (float64, error) {
	if a.player == nil || !a.player.IsRunning() {
		return 0, fmt.Errorf("player not running")
	}
	return a.player.GetSpeed()
}

// ToggleFullscreen toggles fullscreen mode
func (a *App) ToggleFullscreen() error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.ToggleFullscreen()
}

// SetFullscreen sets fullscreen mode
func (a *App) SetFullscreen(fullscreen bool) error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.SetFullscreen(fullscreen)
}

// IsFullscreen returns whether player is in fullscreen mode
func (a *App) IsFullscreen() (bool, error) {
	if a.player == nil || !a.player.IsRunning() {
		return false, fmt.Errorf("player not running")
	}
	return a.player.IsFullscreen()
}

// GetPlaybackState returns complete playback state
func (a *App) GetPlaybackState() (*mpv.PlaybackState, error) {
	if a.player == nil || !a.player.IsRunning() {
		return nil, fmt.Errorf("player not running")
	}
	return a.player.GetPlaybackState()
}

// IsPaused returns whether playback is paused
func (a *App) IsPaused() (bool, error) {
	if a.player == nil || !a.player.IsRunning() {
		return false, fmt.Errorf("player not running")
	}
	return a.player.IsPaused()
}

// StopVideo stops playback and closes player
func (a *App) StopVideo() error {
	if a.player == nil {
		return nil
	}
	return a.player.Stop()
}

// LoadSubtitles loads an external subtitle file
func (a *App) LoadSubtitles(subtitlePath string) error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.LoadSubtitleFile(subtitlePath)
}

// ToggleSubtitles toggles subtitle visibility
func (a *App) ToggleSubtitles() error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.ToggleSubtitles()
}

// SetSubtitleDelay sets subtitle delay in seconds
func (a *App) SetSubtitleDelay(delay float64) error {
	if a.player == nil || !a.player.IsRunning() {
		return fmt.Errorf("player not running")
	}
	return a.player.SetSubtitleDelay(delay)
}

// IsPlayerRunning returns whether the MPV player is currently running
func (a *App) IsPlayerRunning() bool {
	if a.player == nil {
		return false
	}
	return a.player.IsRunning()
}

// GetMPVVersion returns the MPV binary version information
func (a *App) GetMPVVersion() (string, error) {
	if a.player == nil {
		return "", fmt.Errorf("player not initialized")
	}
	return a.player.GetBinaryVersion()
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

// PlayVideoWithTracking plays a video and starts progress tracking
// This is a convenience method that combines PlayVideo and StartTrackingProgress
func (a *App) PlayVideoWithTracking(lectureID int64, filePath string, resume bool) error {
	if a.player == nil {
		return fmt.Errorf("player not initialized")
	}
	if a.tracker == nil {
		return fmt.Errorf("progress tracker not initialized")
	}

	// Get resume position if requested
	var startPosition float64
	if resume {
		var err error
		startPosition, err = a.tracker.GetResumePosition(a.ctx, lectureID)
		if err != nil {
			fmt.Printf("Warning: failed to get resume position: %v\n", err)
		}
	}

	// Start playing video
	var err error
	if !a.player.IsRunning() {
		err = a.player.Start(filePath)
	} else {
		err = a.player.LoadFile(filePath)
	}
	if err != nil {
		return err
	}

	// Seek to resume position if needed
	if startPosition > 0 {
		if err := a.player.Seek(startPosition); err != nil {
			fmt.Printf("Warning: failed to seek to resume position: %v\n", err)
		}
	}

	// Start progress tracking
	return a.tracker.StartTracking(a.ctx, lectureID)
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

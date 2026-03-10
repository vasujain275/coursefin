package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"coursefin/internal/course"
	"coursefin/internal/database"
	"coursefin/internal/player"
	"coursefin/internal/settings"
	"coursefin/internal/sqlc"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx         context.Context
	db          *database.DB
	playerSvc   *player.Service
	videoServer *player.VideoServer
	settingsSvc *settings.Service
	courseSvc   *course.Service
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
		errMsg := fmt.Sprintf("Failed to get app data directory: %v", err)
		slog.Error("failed to get app data directory", "error", err)
		runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "Database Initialization Error",
			Message: errMsg,
		})
		return
	}

	slog.Info("app data directory", "path", dataDir)

	db, err := database.NewDB(dataDir)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to initialize database: %v\n\nData directory: %s", err, dataDir)
		slog.Error("failed to initialize database", "error", err, "dataDir", dataDir)
		runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "Database Initialization Error",
			Message: errMsg,
		})
		return
	}
	a.db = db
	slog.Info("database initialized", "path", db.DBPath())

	// Get courses directory from settings
	coursesDir, err := a.db.Queries().GetCoursesDirectory(ctx)
	if err != nil || coursesDir == "" {
		coursesDir = dataDir // Fallback to data directory
		slog.Info("using default courses directory", "path", coursesDir)
	} else {
		slog.Info("courses directory", "path", coursesDir)
	}

	// Initialize video server for serving videos via localhost HTTP
	// This is needed because WebKitGTK in Wails doesn't properly handle
	// video elements through the AssetHandler
	videoServer, err := player.NewVideoServer()
	if err != nil {
		slog.Warn("failed to start video server", "error", err)
	} else {
		a.videoServer = videoServer
		slog.Info("video server initialized", "port", videoServer.GetPort())
	}

	// Initialize player service with video server
	a.playerSvc = player.NewService(db, coursesDir, a.videoServer)
	slog.Info("player service initialized")

	// Initialize settings service
	a.settingsSvc = settings.NewService(db.Queries())
	slog.Info("settings service initialized")

	// Initialize course service
	a.courseSvc = course.NewService(a.db)
	slog.Info("course service initialized")
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	if a.videoServer != nil {
		slog.Info("stopping video server")
		a.videoServer.Stop()
	}

	if a.db != nil {
		slog.Info("checkpointing WAL before close")
		if _, err := a.db.Conn().Exec("PRAGMA wal_checkpoint(TRUNCATE)"); err != nil {
			slog.Error("WAL checkpoint failed", "error", err)
		}
		slog.Info("closing database connection")
		a.db.Close()
	}
}

func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	http.NotFound(w, r)
}

// =====================================
// Database Query Methods
// =====================================

// GetAllCourses returns all courses from the database
func (a *App) GetAllCourses() ([]*sqlc.ListCoursesWithProgressRow, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	courses, err := a.db.Queries().ListCoursesWithProgress(a.ctx, sqlc.ListCoursesWithProgressParams{
		Limit:  10000,
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list courses: %w", err)
	}

	return courses, nil
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

// GetLectureProgress returns progress information for a specific lecture
func (a *App) GetLectureProgress(lectureID int64) (*sqlc.Progress, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}
	return a.db.Queries().GetProgressByLecture(a.ctx, lectureID)
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

// GetHtmlLectureContent reads an HTML lecture file and returns its content as a string.
// This is used by the frontend's HtmlLectureViewer via iframe srcdoc= so that the HTML
// is injected directly without a cross-origin HTTP request (wails:// → http://127.0.0.1).
func (a *App) GetHtmlLectureContent(lectureID int64) (string, error) {
	if a.courseSvc == nil {
		return "", fmt.Errorf("course service not initialized")
	}
	return a.courseSvc.GetHtmlLectureContent(a.ctx, lectureID)
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

// =====================================
// Settings Methods
// =====================================

// IsFirstRun checks if the app is running for the first time
func (a *App) IsFirstRun() (bool, error) {
	if a.settingsSvc == nil {
		return false, fmt.Errorf("settings service not initialized")
	}
	return a.settingsSvc.IsFirstRun(a.ctx)
}

// CompleteOnboarding marks the onboarding as complete
func (a *App) CompleteOnboarding() error {
	if a.settingsSvc == nil {
		return fmt.Errorf("settings service not initialized")
	}
	return a.settingsSvc.CompleteOnboarding(a.ctx)
}

// GetCoursesDirectory retrieves the courses directory path
func (a *App) GetCoursesDirectory() (string, error) {
	if a.settingsSvc == nil {
		return "", fmt.Errorf("settings service not initialized")
	}
	return a.settingsSvc.GetCoursesDirectory(a.ctx)
}

// SetCoursesDirectory sets the courses directory path
func (a *App) SetCoursesDirectory(path string) error {
	if a.settingsSvc == nil {
		return fmt.Errorf("settings service not initialized")
	}
	return a.settingsSvc.SetCoursesDirectory(a.ctx, path)
}

// GetTheme retrieves the current theme setting
func (a *App) GetTheme() (string, error) {
	if a.settingsSvc == nil {
		return "", fmt.Errorf("settings service not initialized")
	}
	return a.settingsSvc.GetTheme(a.ctx)
}

// SetTheme updates the theme setting
func (a *App) SetTheme(theme string) error {
	if a.settingsSvc == nil {
		return fmt.Errorf("settings service not initialized")
	}
	return a.settingsSvc.SetTheme(a.ctx, theme)
}

// GetSettingValue retrieves any setting by key
func (a *App) GetSettingValue(key string) (string, error) {
	if a.settingsSvc == nil {
		return "", fmt.Errorf("settings service not initialized")
	}
	return a.settingsSvc.GetSetting(a.ctx, key)
}

// SetSettingValue updates any setting by key
func (a *App) SetSettingValue(key, value string) error {
	if a.settingsSvc == nil {
		return fmt.Errorf("settings service not initialized")
	}
	return a.settingsSvc.SetSetting(a.ctx, key, value)
}

// =====================================
// Course Library Methods
// =====================================

// ScanLibrary scans the configured courses directory and imports all subfolders as courses.
// Already-imported courses are skipped. Non-fatal errors (e.g. invalid folder structure)
// are collected per-folder and returned in the result rather than aborting the scan.
func (a *App) ScanLibrary() (*course.ScanLibraryResult, error) {
	if a.courseSvc == nil {
		return nil, fmt.Errorf("course service not initialized")
	}

	coursesDir, err := a.settingsSvc.GetCoursesDirectory(a.ctx)
	if err != nil || coursesDir == "" {
		return nil, fmt.Errorf("courses directory not configured")
	}

	return a.courseSvc.ScanLibrary(a.ctx, coursesDir)
}

// GetSubfolders returns the names of all non-hidden subdirectories inside a directory.
// Used during onboarding to preview how many course folders will be imported.
func (a *App) GetSubfolders(dir string) ([]string, error) {
	if dir == "" {
		return nil, fmt.Errorf("directory path is required")
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	var folders []string
	for _, entry := range entries {
		if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
			folders = append(folders, entry.Name())
		}
	}

	return folders, nil
}

// GetCourseWithSections retrieves a course with all sections and lectures
func (a *App) GetCourseWithSections(courseID int64) (*course.CourseWithSections, error) {
	return a.courseSvc.GetCourseWithSections(a.ctx, courseID)
}

// =====================================
// Native Dialogs
// =====================================

// SelectFolderDialog opens a native folder selection dialog
func (a *App) SelectFolderDialog(title string) (string, error) {
	path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	if err != nil {
		return "", fmt.Errorf("failed to open folder dialog: %w", err)
	}
	return path, nil
}

// =====================================
// Window Management (Fullscreen Fix)
// =====================================

// ToggleWindowFullscreen toggles the entire window fullscreen state
// This bypasses the WebKitGTK HTML5 fullscreen bug that causes black screens
func (a *App) ToggleWindowFullscreen() {
	if runtime.WindowIsFullscreen(a.ctx) {
		runtime.WindowUnfullscreen(a.ctx)
		runtime.EventsEmit(a.ctx, "window:fullscreen", false)
	} else {
		runtime.WindowFullscreen(a.ctx)
		runtime.EventsEmit(a.ctx, "window:fullscreen", true)
	}
}

// IsWindowFullscreen returns the current window fullscreen state
func (a *App) IsWindowFullscreen() bool {
	return runtime.WindowIsFullscreen(a.ctx)
}

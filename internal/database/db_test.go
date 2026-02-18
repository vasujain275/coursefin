package database

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"coursefin/internal/sqlc"
)

func TestNewDB(t *testing.T) {
	// Create temp directory for test database
	tmpDir := t.TempDir()

	// Initialize database
	db, err := NewDB(tmpDir)
	if err != nil {
		t.Fatalf("Failed to create database: %v", err)
	}
	defer db.Close()

	// Verify database file exists
	dbPath := filepath.Join(tmpDir, "coursefin.db")
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		t.Errorf("Database file was not created at %s", dbPath)
	}

	// Test connection
	if err := db.Conn().Ping(); err != nil {
		t.Errorf("Failed to ping database: %v", err)
	}
}

func TestMigrations(t *testing.T) {
	tmpDir := t.TempDir()

	db, err := NewDB(tmpDir)
	if err != nil {
		t.Fatalf("Failed to create database: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	// Test that tables were created
	tables := []string{
		"courses",
		"sections",
		"lectures",
		"subtitles",
		"progress",
		"collections",
		"collection_courses",
		"tags",
		"course_tags",
		"notes",
		"app_settings",
	}

	for _, table := range tables {
		var count int
		query := "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?"
		err := db.Conn().QueryRow(query, table).Scan(&count)
		if err != nil {
			t.Errorf("Failed to query for table %s: %v", table, err)
			continue
		}
		if count == 0 {
			t.Errorf("Table %s was not created", table)
		}
	}

	// Test that default settings were inserted
	settings, err := db.Queries().ListAllSettings(ctx)
	if err != nil {
		t.Errorf("Failed to get settings: %v", err)
	}
	if len(settings) == 0 {
		t.Error("No default settings were inserted")
	}

	// Verify specific settings exist
	expectedSettings := []string{
		"theme",
		"default_playback_speed",
		"auto_mark_complete_threshold",
		"subtitle_language_preference",
		"auto_play_next",
	}

	settingsMap := make(map[string]bool)
	for _, setting := range settings {
		settingsMap[setting.Key] = true
	}

	for _, key := range expectedSettings {
		if !settingsMap[key] {
			t.Errorf("Expected setting %s was not found", key)
		}
	}
}

func TestQueryInterface(t *testing.T) {
	tmpDir := t.TempDir()

	db, err := NewDB(tmpDir)
	if err != nil {
		t.Fatalf("Failed to create database: %v", err)
	}
	defer db.Close()

	// Verify Queries() returns non-nil
	if db.Queries() == nil {
		t.Error("Queries() returned nil")
	}

	// Verify Conn() returns non-nil
	if db.Conn() == nil {
		t.Error("Conn() returned nil")
	}

	// Verify DBPath() returns correct path
	expectedPath := filepath.Join(tmpDir, "coursefin.db")
	if db.DBPath() != expectedPath {
		t.Errorf("DBPath() returned %s, expected %s", db.DBPath(), expectedPath)
	}
}

func TestWithTx(t *testing.T) {
	tmpDir := t.TempDir()

	db, err := NewDB(tmpDir)
	if err != nil {
		t.Fatalf("Failed to create database: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	// Test successful transaction
	err = db.WithTx(func(queries *sqlc.Queries) error {
		// Insert a test setting
		_, err := queries.UpsertSetting(ctx, sqlc.UpsertSettingParams{
			Key:   "test_key",
			Value: "test_value",
		})
		return err
	})
	if err != nil {
		t.Errorf("Transaction failed: %v", err)
	}

	// Verify the setting was inserted
	setting, err := db.Queries().GetSetting(ctx, "test_key")
	if err != nil {
		t.Errorf("Failed to get setting: %v", err)
	}
	if setting.Value != "test_value" {
		t.Errorf("Setting value is %s, expected test_value", setting.Value)
	}
}

func TestGetAppDataDir(t *testing.T) {
	dataDir, err := GetAppDataDir()
	if err != nil {
		t.Fatalf("Failed to get app data dir: %v", err)
	}

	if dataDir == "" {
		t.Error("App data dir is empty")
	}

	// Verify it contains "coursefin"
	if !contains(dataDir, "coursefin") {
		t.Errorf("App data dir %s does not contain 'coursefin'", dataDir)
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || containsMiddle(s, substr)))
}

func containsMiddle(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

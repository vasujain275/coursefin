// ============================================================================
// Settings Service - CourseFin
// ============================================================================
// Purpose: Business logic for application settings management
// Pattern: Service layer wrapping sqlc queries (no repository needed for key-value)
// Usage: Called by Wails app bindings for settings operations
// ============================================================================

package settings

import (
	"context"
	"database/sql"
	"fmt"

	"coursefin/internal/sqlc"
)

// Service handles settings business logic
type Service struct {
	queries *sqlc.Queries
}

// NewService creates a new settings service
func NewService(queries *sqlc.Queries) *Service {
	return &Service{
		queries: queries,
	}
}

// ============================================================================
// First Run / Onboarding
// ============================================================================

// IsFirstRun checks if the application is running for the first time
func (s *Service) IsFirstRun(ctx context.Context) (bool, error) {
	value, err := s.queries.GetSettingValue(ctx, "first_run")
	if err != nil {
		if err == sql.ErrNoRows {
			// Setting doesn't exist - assume first run
			return true, nil
		}
		return false, fmt.Errorf("failed to get first_run setting: %w", err)
	}

	// Check if value is "true" (case-insensitive)
	return value == "true" || value == "True" || value == "TRUE", nil
}

// CompleteOnboarding marks the first run as complete
func (s *Service) CompleteOnboarding(ctx context.Context) error {
	_, err := s.queries.UpsertSetting(ctx, sqlc.UpsertSettingParams{
		Key:   "first_run",
		Value: "false",
	})
	if err != nil {
		return fmt.Errorf("failed to complete onboarding: %w", err)
	}
	return nil
}

// ============================================================================
// Courses Directory
// ============================================================================

// GetCoursesDirectory retrieves the courses library directory path
func (s *Service) GetCoursesDirectory(ctx context.Context) (string, error) {
	value, err := s.queries.GetCoursesDirectory(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil // No directory set yet
		}
		return "", fmt.Errorf("failed to get courses directory: %w", err)
	}
	return value, nil
}

// SetCoursesDirectory sets the courses library directory path
func (s *Service) SetCoursesDirectory(ctx context.Context, path string) error {
	// First, check if the setting exists
	_, err := s.queries.GetSettingValue(ctx, "courses_directory")
	if err != nil {
		if err == sql.ErrNoRows {
			// Setting doesn't exist, insert it
			_, err = s.queries.UpsertSetting(ctx, sqlc.UpsertSettingParams{
				Key:   "courses_directory",
				Value: path,
			})
			if err != nil {
				return fmt.Errorf("failed to insert courses directory: %w", err)
			}
			return nil
		}
		return fmt.Errorf("failed to check courses directory: %w", err)
	}

	// Setting exists, update it
	err = s.queries.SetCoursesDirectory(ctx, path)
	if err != nil {
		return fmt.Errorf("failed to set courses directory: %w", err)
	}
	return nil
}

// ============================================================================
// Theme
// ============================================================================

// GetTheme retrieves the current theme setting
func (s *Service) GetTheme(ctx context.Context) (string, error) {
	value, err := s.queries.GetTheme(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			return "system", nil // Default to system theme
		}
		return "", fmt.Errorf("failed to get theme: %w", err)
	}
	return value, nil
}

// SetTheme updates the theme setting
func (s *Service) SetTheme(ctx context.Context, theme string) error {
	// Validate theme value
	if theme != "light" && theme != "dark" && theme != "system" {
		return fmt.Errorf("invalid theme: %s (must be light, dark, or system)", theme)
	}

	err := s.queries.SetTheme(ctx, theme)
	if err != nil {
		return fmt.Errorf("failed to set theme: %w", err)
	}
	return nil
}

// ============================================================================
// Playback Settings
// ============================================================================

// GetDefaultPlaybackSpeed retrieves the default playback speed
func (s *Service) GetDefaultPlaybackSpeed(ctx context.Context) (string, error) {
	value, err := s.queries.GetDefaultPlaybackSpeed(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			return "1.0", nil // Default speed
		}
		return "", fmt.Errorf("failed to get default playback speed: %w", err)
	}
	return value, nil
}

// GetAutoCompleteThreshold retrieves the auto-complete threshold
func (s *Service) GetAutoCompleteThreshold(ctx context.Context) (string, error) {
	value, err := s.queries.GetAutoCompleteThreshold(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			return "0.90", nil // Default 90%
		}
		return "", fmt.Errorf("failed to get auto complete threshold: %w", err)
	}
	return value, nil
}

// GetSubtitleLanguagePreference retrieves the subtitle language preference
func (s *Service) GetSubtitleLanguagePreference(ctx context.Context) (string, error) {
	value, err := s.queries.GetSubtitleLanguagePreference(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			return "en_US,en", nil // Default to English
		}
		return "", fmt.Errorf("failed to get subtitle language preference: %w", err)
	}
	return value, nil
}

// ============================================================================
// Generic Settings Access
// ============================================================================

// GetSetting retrieves any setting by key
func (s *Service) GetSetting(ctx context.Context, key string) (string, error) {
	value, err := s.queries.GetSettingValue(ctx, key)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("setting not found: %s", key)
		}
		return "", fmt.Errorf("failed to get setting %s: %w", key, err)
	}
	return value, nil
}

// SetSetting upserts any setting by key
func (s *Service) SetSetting(ctx context.Context, key, value string) error {
	_, err := s.queries.UpsertSetting(ctx, sqlc.UpsertSettingParams{
		Key:   key,
		Value: value,
	})
	if err != nil {
		return fmt.Errorf("failed to set setting %s: %w", key, err)
	}
	return nil
}

// GetAllSettings retrieves all settings as a map
func (s *Service) GetAllSettings(ctx context.Context) (map[string]string, error) {
	settings, err := s.queries.ListAllSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list all settings: %w", err)
	}

	result := make(map[string]string, len(settings))
	for _, setting := range settings {
		result[setting.Key] = setting.Value
	}
	return result, nil
}

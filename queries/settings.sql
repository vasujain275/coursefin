-- ============================================================================
-- APP SETTINGS QUERIES
-- ============================================================================
-- Purpose: CRUD operations for app_settings table (key-value store)
-- Usage: Application configuration, user preferences
-- Pattern: UPSERT for updates (INSERT ... ON CONFLICT)
-- ============================================================================

-- ============================================================================
-- CREATE/UPDATE: Upsert setting (INSERT or UPDATE if exists)
-- ============================================================================
-- name: UpsertSetting :one
-- Purpose: Set a configuration value (main method for updating settings)
-- Usage: Save any app setting
-- Logic: If key exists, UPDATE value; else INSERT
-- Returns: Complete setting record after upsert
INSERT INTO app_settings (key, value)
VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- ============================================================================
-- READ: Get setting by key
-- ============================================================================
-- name: GetSetting :one
-- Purpose: Retrieve single setting value
-- Usage: Load specific configuration
-- Returns: NULL if setting doesn't exist
SELECT * FROM app_settings WHERE key = ? LIMIT 1;

-- ============================================================================
-- READ: Get setting value only
-- ============================================================================
-- name: GetSettingValue :one
-- Purpose: Get just the value string (not full record)
-- Usage: Quick value lookup
-- Returns: value as TEXT
SELECT value FROM app_settings WHERE key = ? LIMIT 1;

-- ============================================================================
-- READ: List all settings
-- ============================================================================
-- name: ListAllSettings :many
-- Purpose: Get all configuration keys and values
-- Usage: Settings UI, configuration export
-- Returns: All settings ordered by key
SELECT * FROM app_settings ORDER BY key ASC;

-- ============================================================================
-- READ: List settings by key prefix
-- ============================================================================
-- name: ListSettingsByPrefix :many
-- Purpose: Get all settings matching a key prefix
-- Usage: Get related settings (e.g., all "mpv_*" settings)
-- Example: prefix="mpv_" returns mpv_hwdec, mpv_volume, etc.
SELECT * FROM app_settings 
WHERE key LIKE ? || '%'
ORDER BY key ASC;

-- ============================================================================
-- READ: Check if setting exists
-- ============================================================================
-- name: SettingExists :one
-- Purpose: Quick check if setting key exists
-- Returns: 1 if exists, 0 if not
-- Usage: Validation, conditional logic
SELECT COUNT(*) > 0 as setting_exists
FROM app_settings 
WHERE key = ?;

-- ============================================================================
-- READ: Count total settings
-- ============================================================================
-- name: CountSettings :one
-- Purpose: Get total number of settings
-- Usage: Statistics
SELECT COUNT(*) FROM app_settings;

-- ============================================================================
-- UPDATE: Update setting value
-- ============================================================================
-- name: UpdateSetting :exec
-- Purpose: Update existing setting value (fails if key doesn't exist)
-- Usage: When you know setting exists and want explicit update
UPDATE app_settings SET
    value = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE key = ?;

-- ============================================================================
-- DELETE: Delete setting
-- ============================================================================
-- name: DeleteSetting :exec
-- Purpose: Remove setting (reset to default behavior)
-- Usage: Reset specific setting to application default
DELETE FROM app_settings WHERE key = ?;

-- ============================================================================
-- DELETE: Delete settings by prefix
-- ============================================================================
-- name: DeleteSettingsByPrefix :exec
-- Purpose: Remove all settings matching key prefix
-- Usage: Reset category of settings (e.g., all "mpv_*" settings)
DELETE FROM app_settings WHERE key LIKE ? || '%';

-- ============================================================================
-- SPECIAL QUERIES: Common Settings Access
-- ============================================================================
-- These queries provide convenient access to frequently used settings
-- ============================================================================

-- ============================================================================
-- READ: Get courses directory path
-- ============================================================================
-- name: GetCoursesDirectory :one
-- Purpose: Get the library root directory path
-- Usage: Path resolution (most important setting)
-- Returns: Absolute path to courses folder
SELECT value FROM app_settings WHERE key = 'courses_directory' LIMIT 1;

-- ============================================================================
-- READ: Get theme setting
-- ============================================================================
-- name: GetTheme :one
-- Purpose: Get current theme (light/dark/system)
-- Usage: UI theme application
SELECT value FROM app_settings WHERE key = 'theme' LIMIT 1;

-- ============================================================================
-- READ: Get default playback speed
-- ============================================================================
-- name: GetDefaultPlaybackSpeed :one
-- Purpose: Get default video playback speed
-- Usage: Player initialization
-- Returns: Speed as string (e.g., "1.0", "1.5", "2.0")
SELECT value FROM app_settings WHERE key = 'default_playback_speed' LIMIT 1;

-- ============================================================================
-- READ: Get auto-complete threshold
-- ============================================================================
-- name: GetAutoCompleteThreshold :one
-- Purpose: Get percentage threshold for auto-marking lectures complete
-- Usage: Progress tracking logic
-- Returns: Decimal as string (e.g., "0.90" for 90%)
SELECT value FROM app_settings WHERE key = 'auto_mark_complete_threshold' LIMIT 1;

-- ============================================================================
-- READ: Get subtitle language preference
-- ============================================================================
-- name: GetSubtitleLanguagePreference :one
-- Purpose: Get comma-separated list of preferred subtitle languages
-- Usage: Automatic subtitle selection
-- Returns: Language codes (e.g., "en_US,en,es_ES")
SELECT value FROM app_settings WHERE key = 'subtitle_language_preference' LIMIT 1;

-- ============================================================================
-- UPDATE: Set courses directory
-- ============================================================================
-- name: SetCoursesDirectory :exec
-- Purpose: Set the library root directory (CRITICAL setting)
-- Usage: Initial setup, library relocation
UPDATE app_settings SET
    value = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'courses_directory';

-- ============================================================================
-- UPDATE: Set theme
-- ============================================================================
-- name: SetTheme :exec
-- Purpose: Change application theme
-- Usage: Theme switcher
-- Values: 'light', 'dark', 'system'
UPDATE app_settings SET
    value = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'theme';

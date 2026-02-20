-- ============================================================================
-- SUBTITLES QUERIES
-- ============================================================================
-- Purpose: CRUD operations for subtitles table
-- Usage: Subtitle management, language selection, player integration
-- ============================================================================

-- ============================================================================
-- CREATE: Insert new subtitle track
-- ============================================================================
-- name: CreateSubtitle :one
-- Purpose: Add new subtitle track during course scan
-- Returns: Complete subtitle record with generated ID
-- Note: Uses INSERT OR IGNORE to silently skip duplicates (same lecture+language+format)
INSERT OR IGNORE INTO subtitles (
    lecture_id,
    language,
    format,
    file_path
) VALUES (
    ?, ?, ?, ?
)
RETURNING *;

-- ============================================================================
-- READ: Get subtitle by ID
-- ============================================================================
-- name: GetSubtitleByID :one
-- Purpose: Fetch single subtitle details
SELECT * FROM subtitles WHERE id = ? LIMIT 1;

-- ============================================================================
-- READ: List all subtitles for a lecture
-- ============================================================================
-- name: ListSubtitlesByLecture :many
-- Purpose: Get all available subtitle tracks for a lecture
-- Usage: Subtitle selection menu in player
-- Returns: All languages and formats available
SELECT * FROM subtitles 
WHERE lecture_id = ?
ORDER BY language ASC, format ASC;

-- ============================================================================
-- READ: Get subtitle by lecture and language
-- ============================================================================
-- name: GetSubtitleByLectureAndLanguage :one
-- Purpose: Find specific subtitle track by language (any format)
-- Usage: Auto-select preferred subtitle language
-- Note: Prefers VTT > SRT > ASS if multiple formats exist
SELECT * FROM subtitles 
WHERE lecture_id = ? AND language = ?
ORDER BY 
    CASE format 
        WHEN 'vtt' THEN 1 
        WHEN 'srt' THEN 2 
        WHEN 'ass' THEN 3 
        ELSE 4 
    END
LIMIT 1;

-- ============================================================================
-- READ: Get subtitle by lecture, language, and format
-- ============================================================================
-- name: GetSubtitleByLectureLanguageFormat :one
-- Purpose: Find exact subtitle track (specific language + format)
-- Usage: Precise subtitle selection
SELECT * FROM subtitles 
WHERE lecture_id = ? AND language = ? AND format = ?
LIMIT 1;

-- ============================================================================
-- READ: List subtitle languages for lecture
-- ============================================================================
-- name: ListSubtitleLanguagesByLecture :many
-- Purpose: Get unique list of available languages (ignoring format)
-- Returns: Distinct languages available for this lecture
-- Usage: Language selector UI (show "English, Spanish, French")
SELECT DISTINCT language FROM subtitles 
WHERE lecture_id = ?
ORDER BY language ASC;

-- ============================================================================
-- READ: List subtitles by language (across all lectures)
-- ============================================================================
-- name: ListSubtitlesByLanguage :many
-- Purpose: Find all subtitles in a specific language
-- Usage: Statistics, language coverage reports
SELECT s.*, l.title as lecture_title, l.course_id
FROM subtitles s
INNER JOIN lectures l ON s.lecture_id = l.id
WHERE s.language = ?
ORDER BY l.course_id, l.id;

-- ============================================================================
-- READ: Count subtitles by lecture
-- ============================================================================
-- name: CountSubtitlesByLecture :one
-- Purpose: Get total subtitle track count for a lecture
-- Usage: Validation, statistics
SELECT COUNT(*) FROM subtitles WHERE lecture_id = ?;

-- ============================================================================
-- READ: Check if lecture has subtitles in preferred language
-- ============================================================================
-- name: HasSubtitlesInLanguage :one
-- Purpose: Quick check if lecture has subtitles in specific language
-- Returns: 1 if exists, 0 if not
-- Usage: Fast filtering, UI indicators
SELECT COUNT(*) > 0 as has_language
FROM subtitles 
WHERE lecture_id = ? AND language = ?;

-- ============================================================================
-- READ: Get subtitle statistics for course
-- ============================================================================
-- name: GetSubtitleStatsByCourse :one
-- Purpose: Aggregate subtitle coverage for entire course
-- Returns: Total lectures with subtitles, languages available
-- Usage: Course detail statistics
SELECT 
    COUNT(DISTINCT s.lecture_id) as lectures_with_subtitles,
    COUNT(DISTINCT s.language) as unique_languages,
    COUNT(s.id) as total_subtitle_tracks
FROM subtitles s
INNER JOIN lectures l ON s.lecture_id = l.id
WHERE l.course_id = ?;

-- ============================================================================
-- READ: List all available languages in library
-- ============================================================================
-- name: ListAllSubtitleLanguages :many
-- Purpose: Get all unique subtitle languages across entire library
-- Returns: Distinct languages with count of lectures
-- Usage: Global language filter, statistics
SELECT 
    language,
    COUNT(DISTINCT lecture_id) as lecture_count
FROM subtitles
GROUP BY language
ORDER BY lecture_count DESC;

-- ============================================================================
-- UPDATE: Update subtitle file path
-- ============================================================================
-- name: UpdateSubtitlePath :exec
-- Purpose: Update subtitle file location (after file move/rename)
-- Usage: Library maintenance, file reorganization
UPDATE subtitles SET
    file_path = ?
WHERE id = ?;

-- ============================================================================
-- DELETE: Delete subtitle
-- ============================================================================
-- name: DeleteSubtitle :exec
-- Purpose: Remove specific subtitle track
-- Usage: Subtitle cleanup, file deletion
DELETE FROM subtitles WHERE id = ?;

-- ============================================================================
-- DELETE: Delete subtitles by lecture
-- ============================================================================
-- name: DeleteSubtitlesByLecture :exec
-- Purpose: Remove all subtitle tracks for a lecture
-- Usage: Lecture cleanup (normally handled by CASCADE)
DELETE FROM subtitles WHERE lecture_id = ?;

-- ============================================================================
-- DELETE: Delete subtitles by language
-- ============================================================================
-- name: DeleteSubtitlesByLanguage :exec
-- Purpose: Remove all subtitles in a specific language
-- Usage: Language-specific cleanup (rare use case)
DELETE FROM subtitles WHERE language = ?;

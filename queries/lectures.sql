-- ============================================================================
-- LECTURES QUERIES
-- ============================================================================
-- Purpose: CRUD operations for lectures table
-- Usage: Lecture management, playback, video metadata
-- ============================================================================

-- ============================================================================
-- CREATE: Insert new lecture
-- ============================================================================
-- name: CreateLecture :one
-- Purpose: Add new lecture during course scan
-- Returns: Complete lecture record with generated ID
INSERT INTO lectures (
    section_id,
    course_id,
    title,
    lecture_number,
    lecture_type,
    is_quiz,
    is_downloadable,
    file_path,
    original_filename,
    resources_path,
    file_size,
    duration,
    video_codec,
    resolution,
    has_subtitles
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)
RETURNING *;

-- ============================================================================
-- READ: Get lecture by ID
-- ============================================================================
-- name: GetLectureByID :one
-- Purpose: Fetch single lecture details
-- Usage: Player initialization, lecture details view
SELECT * FROM lectures WHERE id = ? LIMIT 1;

-- ============================================================================
-- READ: Get lecture with subtitles
-- ============================================================================
-- name: GetLectureWithSubtitles :one
-- Purpose: Get lecture with all available subtitle tracks
-- Returns: Lecture info + JSON array of subtitles
-- Usage: Player initialization with subtitle selection
SELECT 
    l.*,
    json_group_array(
        json_object(
            'id', s.id,
            'language', s.language,
            'format', s.format,
            'file_path', s.file_path
        )
    ) FILTER (WHERE s.id IS NOT NULL) as subtitles_json
FROM lectures l
LEFT JOIN subtitles s ON l.id = s.lecture_id
WHERE l.id = ?
GROUP BY l.id;

-- ============================================================================
-- READ: List lectures by section (ordered)
-- ============================================================================
-- name: ListLecturesBySection :many
-- Purpose: Get all lectures in a section, ordered by lecture_number
-- Usage: Section view, course navigation
SELECT * FROM lectures 
WHERE section_id = ?
ORDER BY lecture_number ASC;

-- ============================================================================
-- READ: List lectures by course
-- ============================================================================
-- name: ListLecturesByCourse :many
-- Purpose: Get all lectures across all sections for a course
-- Usage: Course-wide operations, bulk updates
SELECT * FROM lectures 
WHERE course_id = ?
ORDER BY section_id, lecture_number ASC;

-- ============================================================================
-- READ: List video lectures only (exclude text/quiz/documents)
-- ============================================================================
-- name: ListVideoLecturesByCourse :many
-- Purpose: Get only playable video lectures
-- Usage: Video-only views, playback queues
SELECT * FROM lectures 
WHERE course_id = ? AND lecture_type = 'video'
ORDER BY section_id, lecture_number ASC;

-- ============================================================================
-- READ: Get next lecture in sequence
-- ============================================================================
-- name: GetNextLecture :one
-- Purpose: Find next lecture after current one (for auto-play)
-- Logic: Next lecture in same section, or first lecture of next section
-- Usage: Auto-play next feature
SELECT * FROM lectures 
WHERE course_id = ? 
  AND (
    (section_id = ? AND lecture_number > ?)
    OR (section_id > ?)
  )
ORDER BY section_id ASC, lecture_number ASC
LIMIT 1;

-- ============================================================================
-- READ: Get previous lecture in sequence
-- ============================================================================
-- name: GetPreviousLecture :one
-- Purpose: Find previous lecture before current one
-- Logic: Previous lecture in same section, or last lecture of previous section
-- Usage: Previous button in player
SELECT * FROM lectures 
WHERE course_id = ? 
  AND (
    (section_id = ? AND lecture_number < ?)
    OR (section_id < ?)
  )
ORDER BY section_id DESC, lecture_number DESC
LIMIT 1;

-- ============================================================================
-- READ: Get lecture with progress
-- ============================================================================
-- name: GetLectureWithProgress :one
-- Purpose: Get lecture combined with user's watch progress
-- Returns: Lecture + progress data in one query
-- Usage: Resume functionality, UI progress indicators
SELECT 
    l.*,
    p.id as progress_id,
    p.watched_duration,
    p.last_position,
    p.completed,
    p.watch_count,
    p.last_watched_at
FROM lectures l
LEFT JOIN progress p ON l.id = p.lecture_id
WHERE l.id = ?;

-- ============================================================================
-- READ: List lectures with progress by section
-- ============================================================================
-- name: ListLecturesWithProgressBySection :many
-- Purpose: Get section's lectures with completion status
-- Returns: Lectures with progress indicators
-- Usage: Section view with checkmarks for completed lectures
SELECT 
    l.*,
    COALESCE(p.completed, 0) as is_completed,
    p.last_position,
    p.watch_count
FROM lectures l
LEFT JOIN progress p ON l.id = p.lecture_id
WHERE l.section_id = ?
ORDER BY l.lecture_number ASC;

-- ============================================================================
-- READ: Get first unwatched lecture in course
-- ============================================================================
-- name: GetFirstUnwatchedLecture :one
-- Purpose: Find first incomplete lecture for "Continue" button
-- Usage: Resume course from where user left off
SELECT l.* FROM lectures l
LEFT JOIN progress p ON l.id = p.lecture_id
WHERE l.course_id = ? 
  AND l.lecture_type = 'video'
  AND (p.completed IS NULL OR p.completed = 0)
ORDER BY l.section_id ASC, l.lecture_number ASC
LIMIT 1;

-- ============================================================================
-- READ: Count lectures by course
-- ============================================================================
-- name: CountLecturesByCourse :one
-- Purpose: Get total lecture count for a course
-- Usage: Statistics, validation
SELECT COUNT(*) FROM lectures WHERE course_id = ?;

-- ============================================================================
-- READ: Count lectures by section
-- ============================================================================
-- name: CountLecturesBySection :one
-- Purpose: Get lecture count for a section
-- Usage: Section headers showing "X lectures"
SELECT COUNT(*) FROM lectures WHERE section_id = ?;

-- ============================================================================
-- READ: Count lectures by type
-- ============================================================================
-- name: CountLecturesByType :one
-- Purpose: Count lectures of specific type in a course
-- Usage: Statistics (e.g., "23 videos, 5 quizzes, 12 resources")
SELECT COUNT(*) FROM lectures 
WHERE course_id = ? AND lecture_type = ?;

-- ============================================================================
-- READ: Get lecture statistics for course
-- ============================================================================
-- name: GetLectureStatsByCourse :one
-- Purpose: Aggregate statistics for all lecture types
-- Returns: Counts per type + total duration
-- Usage: Course detail view statistics
SELECT 
    COUNT(*) as total_lectures,
    COUNT(CASE WHEN lecture_type = 'video' THEN 1 END) as video_count,
    COUNT(CASE WHEN lecture_type = 'text' THEN 1 END) as text_count,
    COUNT(CASE WHEN lecture_type = 'quiz' THEN 1 END) as quiz_count,
    COUNT(CASE WHEN lecture_type = 'document' THEN 1 END) as document_count,
    SUM(CASE WHEN lecture_type = 'video' THEN duration ELSE 0 END) as total_video_duration,
    COUNT(CASE WHEN has_subtitles = 1 THEN 1 END) as lectures_with_subtitles
FROM lectures 
WHERE course_id = ?;

-- ============================================================================
-- UPDATE: Update lecture metadata
-- ============================================================================
-- name: UpdateLecture :one
-- Purpose: Update lecture information
-- Returns: Updated lecture record
UPDATE lectures SET
    title = ?,
    lecture_type = ?,
    is_quiz = ?,
    file_path = ?,
    resources_path = ?,
    file_size = ?,
    duration = ?,
    video_codec = ?,
    resolution = ?
WHERE id = ?
RETURNING *;

-- ============================================================================
-- UPDATE: Update lecture subtitle status
-- ============================================================================
-- name: UpdateLectureSubtitleStatus :exec
-- Purpose: Update has_subtitles flag when subtitles are added/removed
-- Usage: Called after subtitle operations to keep denormalized flag in sync
UPDATE lectures SET
    has_subtitles = ?
WHERE id = ?;

-- ============================================================================
-- UPDATE: Update video metadata (after ffprobe)
-- ============================================================================
-- name: UpdateLectureVideoMetadata :exec
-- Purpose: Update video technical details after analysis
-- Usage: After running ffprobe on video file
UPDATE lectures SET
    file_size = ?,
    duration = ?,
    video_codec = ?,
    resolution = ?
WHERE id = ?;

-- ============================================================================
-- DELETE: Delete lecture
-- ============================================================================
-- name: DeleteLecture :exec
-- Purpose: Remove lecture (cascade deletes progress and subtitles)
-- Usage: Lecture removal, cleanup
DELETE FROM lectures WHERE id = ?;

-- ============================================================================
-- DELETE: Delete lectures by section
-- ============================================================================
-- name: DeleteLecturesBySection :exec
-- Purpose: Remove all lectures in a section
-- Usage: Section cleanup
DELETE FROM lectures WHERE section_id = ?;

-- ============================================================================
-- DELETE: Delete lectures by course
-- ============================================================================
-- name: DeleteLecturesByCourse :exec
-- Purpose: Remove all lectures for a course
-- Usage: Course removal (normally handled by CASCADE)
DELETE FROM lectures WHERE course_id = ?;

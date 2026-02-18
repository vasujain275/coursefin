-- ============================================================================
-- PROGRESS QUERIES
-- ============================================================================
-- Purpose: CRUD operations for progress tracking
-- Usage: Watch history, resume functionality, completion tracking
-- Update Pattern: Use UPSERT (INSERT ... ON CONFLICT) for real-time updates
-- ============================================================================

-- ============================================================================
-- CREATE/UPDATE: Upsert progress (INSERT or UPDATE if exists)
-- ============================================================================
-- name: UpsertProgress :one
-- Purpose: Create or update progress record (main progress tracking method)
-- Usage: Called during video playback every 5-10 seconds
-- Logic: If lecture_id exists, UPDATE; else INSERT
-- Returns: Complete progress record after upsert
INSERT INTO progress (
    lecture_id,
    course_id,
    watched_duration,
    total_duration,
    last_position,
    completed,
    watch_count,
    first_watched_at,
    last_watched_at
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?
)
ON CONFLICT(lecture_id) DO UPDATE SET
    watched_duration = excluded.watched_duration,
    total_duration = excluded.total_duration,
    last_position = excluded.last_position,
    completed = excluded.completed,
    watch_count = progress.watch_count + excluded.watch_count,  -- Increment watch count
    last_watched_at = excluded.last_watched_at,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- ============================================================================
-- CREATE: Insert new progress record
-- ============================================================================
-- name: CreateProgress :one
-- Purpose: Explicitly create new progress record
-- Usage: When starting a lecture for the first time
-- Returns: New progress record
INSERT INTO progress (
    lecture_id,
    course_id,
    watched_duration,
    total_duration,
    last_position,
    completed,
    watch_count,
    first_watched_at,
    last_watched_at
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?
)
RETURNING *;

-- ============================================================================
-- READ: Get progress by lecture ID
-- ============================================================================
-- name: GetProgressByLecture :one
-- Purpose: Fetch progress for specific lecture
-- Usage: Resume functionality, progress display
SELECT * FROM progress WHERE lecture_id = ? LIMIT 1;

-- ============================================================================
-- READ: Get progress by ID
-- ============================================================================
-- name: GetProgressByID :one
-- Purpose: Fetch progress record by primary key
SELECT * FROM progress WHERE id = ? LIMIT 1;

-- ============================================================================
-- READ: List progress by course
-- ============================================================================
-- name: ListProgressByCourse :many
-- Purpose: Get all progress records for a course
-- Usage: Course-level statistics, progress overview
SELECT * FROM progress 
WHERE course_id = ?
ORDER BY last_watched_at DESC;

-- ============================================================================
-- READ: Get course progress summary
-- ============================================================================
-- name: GetCourseProgressSummary :one
-- Purpose: Aggregate progress statistics for entire course
-- Returns: Completion stats, watch time, last activity
-- Usage: Course cards, detail views
SELECT 
    COUNT(*) as total_progress_records,
    COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_count,
    SUM(watched_duration) as total_watched_duration,
    MAX(last_watched_at) as last_watched_at,
    CAST(COUNT(CASE WHEN completed = 1 THEN 1 END) AS REAL) / 
        NULLIF(COUNT(*), 0) * 100 as completion_percentage
FROM progress 
WHERE course_id = ?;

-- ============================================================================
-- READ: List recently watched lectures (across all courses)
-- ============================================================================
-- name: ListRecentlyWatchedLectures :many
-- Purpose: Get most recently watched lectures globally
-- Returns: Progress records with lecture and course info
-- Usage: "Continue Watching" dashboard section
SELECT 
    p.*,
    l.title as lecture_title,
    l.duration as lecture_duration,
    c.title as course_title
FROM progress p
INNER JOIN lectures l ON p.lecture_id = l.id
INNER JOIN courses c ON p.course_id = c.id
WHERE p.last_watched_at IS NOT NULL
ORDER BY p.last_watched_at DESC
LIMIT ?;

-- ============================================================================
-- READ: List in-progress lectures (started but not completed)
-- ============================================================================
-- name: ListInProgressLectures :many
-- Purpose: Get lectures that are partially watched
-- Returns: Progress records where completed=0 but last_position > 0
-- Usage: "Continue Learning" section
SELECT 
    p.*,
    l.title as lecture_title,
    l.duration as lecture_duration,
    c.title as course_title
FROM progress p
INNER JOIN lectures l ON p.lecture_id = l.id
INNER JOIN courses c ON p.course_id = c.id
WHERE p.completed = 0 AND p.last_position > 0
ORDER BY p.last_watched_at DESC
LIMIT ?;

-- ============================================================================
-- READ: List completed lectures by course
-- ============================================================================
-- name: ListCompletedLecturesByCourse :many
-- Purpose: Get all completed lectures in a course
-- Usage: Completion tracking, statistics
SELECT * FROM progress 
WHERE course_id = ? AND completed = 1
ORDER BY last_watched_at DESC;

-- ============================================================================
-- READ: Count completed lectures by course
-- ============================================================================
-- name: CountCompletedLecturesByCourse :one
-- Purpose: Get count of completed lectures
-- Usage: Progress percentage calculation
SELECT COUNT(*) FROM progress 
WHERE course_id = ? AND completed = 1;

-- ============================================================================
-- READ: Count total progress records by course
-- ============================================================================
-- name: CountProgressByCourse :one
-- Purpose: Get total number of lectures with any progress
-- Usage: Statistics
SELECT COUNT(*) FROM progress WHERE course_id = ?;

-- ============================================================================
-- READ: Get total watch time by course
-- ============================================================================
-- name: GetTotalWatchTimeByCourse :one
-- Purpose: Sum all watched_duration for a course
-- Returns: Total seconds watched (can exceed course length if rewatched)
-- Usage: Statistics, analytics
SELECT SUM(watched_duration) as total_seconds
FROM progress 
WHERE course_id = ?;

-- ============================================================================
-- READ: Get global watch statistics
-- ============================================================================
-- name: GetGlobalWatchStats :one
-- Purpose: Aggregate statistics across entire library
-- Returns: Total courses started, lectures completed, watch time
-- Usage: Dashboard statistics, achievements
SELECT 
    COUNT(DISTINCT course_id) as courses_started,
    COUNT(*) as total_lectures_started,
    COUNT(CASE WHEN completed = 1 THEN 1 END) as total_lectures_completed,
    SUM(watched_duration) as total_watch_time_seconds,
    MAX(last_watched_at) as last_activity
FROM progress;

-- ============================================================================
-- READ: Check if lecture is completed
-- ============================================================================
-- name: IsLectureCompleted :one
-- Purpose: Quick check if lecture is marked complete
-- Returns: 1 if completed, 0 if not
-- Usage: UI checkmarks, filtering
SELECT COALESCE(completed, 0) as is_completed
FROM progress 
WHERE lecture_id = ?;

-- ============================================================================
-- UPDATE: Update progress position (during playback)
-- ============================================================================
-- name: UpdateProgressPosition :exec
-- Purpose: Update playback position and watched duration
-- Usage: Real-time progress tracking during video playback
UPDATE progress SET
    watched_duration = ?,
    last_position = ?,
    last_watched_at = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE lecture_id = ?;

-- ============================================================================
-- UPDATE: Mark lecture as completed
-- ============================================================================
-- name: MarkLectureCompleted :exec
-- Purpose: Set lecture as completed (called when watch threshold reached)
-- Usage: Automatic completion at 90% or manual completion
UPDATE progress SET
    completed = 1,
    last_position = total_duration,  -- Set to end
    last_watched_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE lecture_id = ?;

-- ============================================================================
-- UPDATE: Mark lecture as incomplete (reset completion)
-- ============================================================================
-- name: MarkLectureIncomplete :exec
-- Purpose: Un-mark lecture as completed
-- Usage: Manual reset, re-watch
UPDATE progress SET
    completed = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE lecture_id = ?;

-- ============================================================================
-- UPDATE: Reset lecture progress (start over)
-- ============================================================================
-- name: ResetLectureProgress :exec
-- Purpose: Reset all progress for a lecture (keep record but clear position)
-- Usage: "Start over" feature
UPDATE progress SET
    watched_duration = 0,
    last_position = 0,
    completed = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE lecture_id = ?;

-- ============================================================================
-- UPDATE: Increment watch count
-- ============================================================================
-- name: IncrementWatchCount :exec
-- Purpose: Increment watch count when lecture is started (not resumed)
-- Usage: Called on fresh play (not resume)
UPDATE progress SET
    watch_count = watch_count + 1,
    last_watched_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE lecture_id = ?;

-- ============================================================================
-- DELETE: Delete progress record
-- ============================================================================
-- name: DeleteProgress :exec
-- Purpose: Remove progress for specific lecture
-- Usage: Manual progress reset (full delete)
DELETE FROM progress WHERE lecture_id = ?;

-- ============================================================================
-- DELETE: Delete progress by course
-- ============================================================================
-- name: DeleteProgressByCourse :exec
-- Purpose: Remove all progress records for a course
-- Usage: Course reset, cleanup (normally handled by CASCADE)
DELETE FROM progress WHERE course_id = ?;

-- ============================================================================
-- DELETE: Delete all completed progress (cleanup)
-- ============================================================================
-- name: DeleteCompletedProgress :exec
-- Purpose: Remove all completed lecture records (rare use case)
-- Usage: Database cleanup, "clear completed" feature
DELETE FROM progress WHERE completed = 1;

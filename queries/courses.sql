-- ============================================================================
-- COURSES QUERIES
-- ============================================================================
-- Purpose: CRUD operations and queries for courses table
-- Usage: Course library management, imports, metadata updates
-- ============================================================================

-- ============================================================================
-- CREATE: Insert new course
-- ============================================================================
-- name: CreateCourse :one
-- Purpose: Add a new course to the library
-- Returns: Complete course record with generated ID
-- Usage: After scanning course folder
INSERT INTO courses (
    title,
    slug,
    description,
    instructor_name,
    thumbnail_url,
    thumbnail_path,
    course_path,
    total_duration,
    total_lectures
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?
)
RETURNING *;

-- ============================================================================
-- READ: Get single course by ID
-- ============================================================================
-- name: GetCourseByID :one
-- Purpose: Fetch complete course details
-- Usage: Course detail view, editing
SELECT * FROM courses WHERE id = ? LIMIT 1;

-- ============================================================================
-- READ: Get course by slug (URL-friendly identifier)
-- ============================================================================
-- name: GetCourseBySlug :one
-- Purpose: Fetch course by unique slug (for URL routing)
-- Usage: Deep linking, sharing course links
SELECT * FROM courses WHERE slug = ? LIMIT 1;

-- ============================================================================
-- READ: Get course by filesystem path
-- ============================================================================
-- name: GetCourseByPath :one
-- Purpose: Find course by its folder path (for re-scanning, duplicate detection)
-- Usage: Import validation, detecting if course already exists
SELECT * FROM courses WHERE course_path = ? LIMIT 1;

-- ============================================================================
-- READ: List all courses (paginated)
-- ============================================================================
-- name: ListCourses :many
-- Purpose: Get all courses with pagination
-- Usage: Main library grid view
-- Note: Returns ordered by created_at DESC (newest first)
SELECT * FROM courses 
ORDER BY created_at DESC
LIMIT ? OFFSET ?;

-- ============================================================================
-- READ: Search courses by title
-- ============================================================================
-- name: SearchCoursesByTitle :many
-- Purpose: Full-text search in course titles
-- Usage: Search functionality
-- Note: Uses LIKE with wildcards for case-insensitive partial matching
SELECT * FROM courses 
WHERE title LIKE '%' || ? || '%'
ORDER BY title ASC
LIMIT ?;

-- ============================================================================
-- READ: Get course with progress stats
-- ============================================================================
-- name: GetCourseWithProgress :one
-- Purpose: Get course with aggregated progress statistics
-- Returns: Course + completion percentage + watched lectures count
-- Usage: Library grid cards showing progress
SELECT 
    c.*,
    COUNT(CASE WHEN p.completed = 1 THEN 1 END) as completed_lectures,
    COUNT(p.id) as total_progress_records,
    CAST(CAST(COUNT(CASE WHEN p.completed = 1 THEN 1 END) AS REAL) / 
        NULLIF(c.total_lectures, 0) * 100 AS REAL) as completion_percentage
FROM courses c
LEFT JOIN progress p ON c.id = p.course_id
WHERE c.id = ?
GROUP BY c.id;

-- ============================================================================
-- READ: List courses with progress (for library view)
-- ============================================================================
-- name: ListCoursesWithProgress :many
-- Purpose: Get all courses with progress stats for grid view
-- Returns: Courses with completion percentage
-- Usage: Main library view with progress indicators
SELECT 
    c.*,
    COUNT(CASE WHEN p.completed = 1 THEN 1 END) as completed_lectures,
    CAST(CAST(COUNT(CASE WHEN p.completed = 1 THEN 1 END) AS REAL) / 
        NULLIF(c.total_lectures, 0) * 100 AS REAL) as completion_percentage
FROM courses c
LEFT JOIN progress p ON c.id = p.course_id
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT ? OFFSET ?;

-- ============================================================================
-- READ: Get recently added courses
-- ============================================================================
-- name: GetRecentlyAddedCourses :many
-- Purpose: Get most recently imported courses
-- Usage: "Recently Added" section on home view
SELECT * FROM courses 
ORDER BY created_at DESC
LIMIT ?;

-- ============================================================================
-- READ: Get recently watched courses
-- ============================================================================
-- name: GetRecentlyWatchedCourses :many
-- Purpose: Get courses ordered by most recent watch activity
-- Usage: "Continue Watching" section
SELECT DISTINCT c.*
FROM courses c
INNER JOIN progress p ON c.id = p.course_id
WHERE p.last_watched_at IS NOT NULL
ORDER BY p.last_watched_at DESC
LIMIT ?;

-- ============================================================================
-- READ: Get in-progress courses (started but not completed)
-- ============================================================================
-- name: GetInProgressCourses :many
-- Purpose: Get courses that are partially completed
-- Usage: "Continue Learning" section
-- Logic: Has at least one progress record, but not all lectures completed
SELECT DISTINCT c.*
FROM courses c
INNER JOIN progress p ON c.id = p.course_id
WHERE EXISTS (
    SELECT 1 FROM progress 
    WHERE course_id = c.id AND completed = 0
)
AND EXISTS (
    SELECT 1 FROM progress 
    WHERE course_id = c.id AND completed = 1
)
ORDER BY p.last_watched_at DESC
LIMIT ?;

-- ============================================================================
-- READ: Count total courses
-- ============================================================================
-- name: CountCourses :one
-- Purpose: Get total number of courses in library
-- Usage: Pagination calculations, statistics
SELECT COUNT(*) FROM courses;

-- ============================================================================
-- UPDATE: Update course metadata
-- ============================================================================
-- name: UpdateCourse :one
-- Purpose: Update course information (after manual edit)
-- Returns: Updated course record
UPDATE courses SET
    title = ?,
    description = ?,
    instructor_name = ?,
    thumbnail_url = ?,
    thumbnail_path = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?
RETURNING *;

-- ============================================================================
-- UPDATE: Update course aggregated stats
-- ============================================================================
-- name: UpdateCourseStats :exec
-- Purpose: Update total_duration and total_lectures after scanning lectures
-- Usage: After importing or re-scanning course
UPDATE courses SET
    total_duration = ?,
    total_lectures = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- ============================================================================
-- UPDATE: Update course thumbnail path
-- ============================================================================
-- name: UpdateCourseThumbnailPath :exec
-- Purpose: Update thumbnail path after downloading image
-- Usage: After thumbnail download
UPDATE courses SET
    thumbnail_path = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- ============================================================================
-- DELETE: Delete course
-- ============================================================================
-- name: DeleteCourse :exec
-- Purpose: Remove course from library
-- Note: CASCADE deletes all sections, lectures, progress, subtitles
-- Usage: Course removal, library cleanup
DELETE FROM courses WHERE id = ?;

-- ============================================================================
-- DELETE: Delete course by path
-- ============================================================================
-- name: DeleteCourseByPath :exec
-- Purpose: Remove course by filesystem path
-- Usage: Cleanup after folder deletion
DELETE FROM courses WHERE course_path = ?;

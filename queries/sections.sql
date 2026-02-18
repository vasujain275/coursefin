-- ============================================================================
-- SECTIONS QUERIES
-- ============================================================================
-- Purpose: CRUD operations for sections table
-- Usage: Course structure, section management
-- ============================================================================

-- ============================================================================
-- CREATE: Insert new section
-- ============================================================================
-- name: CreateSection :one
-- Purpose: Add new section during course scan
-- Returns: Complete section record with generated ID
INSERT INTO sections (
    course_id,
    title,
    section_number,
    description
) VALUES (
    ?, ?, ?, ?
)
RETURNING *;

-- ============================================================================
-- READ: Get section by ID
-- ============================================================================
-- name: GetSectionByID :one
-- Purpose: Fetch single section details
-- Usage: Section detail view
SELECT * FROM sections WHERE id = ? LIMIT 1;

-- ============================================================================
-- READ: List sections by course (ordered)
-- ============================================================================
-- name: ListSectionsByCourse :many
-- Purpose: Get all sections for a course, ordered by section_number
-- Usage: Course structure display, navigation
SELECT * FROM sections 
WHERE course_id = ?
ORDER BY section_number ASC;

-- ============================================================================
-- READ: Get section with lecture count
-- ============================================================================
-- name: GetSectionWithLectureCount :one
-- Purpose: Get section with count of lectures it contains
-- Returns: Section + lecture count
-- Usage: Section headers showing "Section 1: Title (12 lectures)"
SELECT 
    s.*,
    COUNT(l.id) as lecture_count,
    SUM(CASE WHEN l.lecture_type = 'video' THEN l.duration ELSE 0 END) as total_duration
FROM sections s
LEFT JOIN lectures l ON s.id = l.section_id
WHERE s.id = ?
GROUP BY s.id;

-- ============================================================================
-- READ: List sections with lecture counts
-- ============================================================================
-- name: ListSectionsWithLectureCounts :many
-- Purpose: Get all sections for a course with lecture counts
-- Returns: Sections with lecture counts and durations
-- Usage: Course structure overview
SELECT 
    s.*,
    COUNT(l.id) as lecture_count,
    SUM(CASE WHEN l.lecture_type = 'video' THEN l.duration ELSE 0 END) as total_duration
FROM sections s
LEFT JOIN lectures l ON s.id = l.section_id
WHERE s.course_id = ?
GROUP BY s.id
ORDER BY s.section_number ASC;

-- ============================================================================
-- READ: Get section with progress
-- ============================================================================
-- name: GetSectionWithProgress :one
-- Purpose: Get section with completion statistics
-- Returns: Section + completed/total lectures
-- Usage: Section progress indicators
SELECT 
    s.*,
    COUNT(l.id) as total_lectures,
    COUNT(CASE WHEN p.completed = 1 THEN 1 END) as completed_lectures,
    CAST(COUNT(CASE WHEN p.completed = 1 THEN 1 END) AS REAL) / 
        NULLIF(COUNT(l.id), 0) * 100 as completion_percentage
FROM sections s
LEFT JOIN lectures l ON s.id = l.section_id
LEFT JOIN progress p ON l.id = p.lecture_id
WHERE s.id = ?
GROUP BY s.id;

-- ============================================================================
-- READ: List sections with progress
-- ============================================================================
-- name: ListSectionsWithProgress :many
-- Purpose: Get all sections for course with completion stats
-- Returns: Sections with progress percentages
-- Usage: Course view with section-level progress bars
SELECT 
    s.*,
    COUNT(l.id) as total_lectures,
    COUNT(CASE WHEN p.completed = 1 THEN 1 END) as completed_lectures,
    CAST(COUNT(CASE WHEN p.completed = 1 THEN 1 END) AS REAL) / 
        NULLIF(COUNT(l.id), 0) * 100 as completion_percentage
FROM sections s
LEFT JOIN lectures l ON s.id = l.section_id
LEFT JOIN progress p ON l.id = p.lecture_id
WHERE s.course_id = ?
GROUP BY s.id
ORDER BY s.section_number ASC;

-- ============================================================================
-- READ: Get next section
-- ============================================================================
-- name: GetNextSection :one
-- Purpose: Find next section after current one
-- Usage: Navigation, auto-advance to next section
SELECT * FROM sections 
WHERE course_id = ? AND section_number > ?
ORDER BY section_number ASC
LIMIT 1;

-- ============================================================================
-- READ: Get previous section
-- ============================================================================
-- name: GetPreviousSection :one
-- Purpose: Find previous section before current one
-- Usage: Navigation
SELECT * FROM sections 
WHERE course_id = ? AND section_number < ?
ORDER BY section_number DESC
LIMIT 1;

-- ============================================================================
-- READ: Count sections by course
-- ============================================================================
-- name: CountSectionsByCourse :one
-- Purpose: Get total section count for a course
-- Usage: Statistics, validation
SELECT COUNT(*) FROM sections WHERE course_id = ?;

-- ============================================================================
-- UPDATE: Update section
-- ============================================================================
-- name: UpdateSection :one
-- Purpose: Update section information
-- Returns: Updated section record
UPDATE sections SET
    title = ?,
    description = ?
WHERE id = ?
RETURNING *;

-- ============================================================================
-- UPDATE: Reorder section (change section_number)
-- ============================================================================
-- name: UpdateSectionNumber :exec
-- Purpose: Change section's position in course
-- Usage: Manual section reordering (future feature)
-- Note: Application must handle uniqueness constraint conflicts
UPDATE sections SET
    section_number = ?
WHERE id = ?;

-- ============================================================================
-- DELETE: Delete section
-- ============================================================================
-- name: DeleteSection :exec
-- Purpose: Remove section (cascade deletes lectures, progress, subtitles)
-- Usage: Section removal, cleanup
DELETE FROM sections WHERE id = ?;

-- ============================================================================
-- DELETE: Delete sections by course
-- ============================================================================
-- name: DeleteSectionsByCourse :exec
-- Purpose: Remove all sections for a course
-- Usage: Course removal (normally handled by CASCADE)
DELETE FROM sections WHERE course_id = ?;

-- +goose Down
-- +goose StatementBegin

-- ============================================================================
-- CourseFin Database Schema - Rollback Migration
-- ============================================================================
-- Purpose: Clean rollback of initial schema
-- Order: Drop in reverse dependency order (children before parents)
-- ============================================================================

-- Drop indexes first (performance - allows faster table drops)
DROP INDEX IF EXISTS idx_notes_course;
DROP INDEX IF EXISTS idx_notes_lecture;
DROP INDEX IF EXISTS idx_tags_name;
DROP INDEX IF EXISTS idx_course_tags_tag;
DROP INDEX IF EXISTS idx_course_tags_course;
DROP INDEX IF EXISTS idx_collection_courses_course;
DROP INDEX IF EXISTS idx_collection_courses_collection;
DROP INDEX IF EXISTS idx_progress_course_completed;
DROP INDEX IF EXISTS idx_progress_updated_at;
DROP INDEX IF EXISTS idx_progress_completed;
DROP INDEX IF EXISTS idx_progress_course;
DROP INDEX IF EXISTS idx_progress_lecture;
DROP INDEX IF EXISTS idx_subtitles_language;
DROP INDEX IF EXISTS idx_subtitles_lecture;
DROP INDEX IF EXISTS idx_lectures_course_section;
DROP INDEX IF EXISTS idx_lectures_type;
DROP INDEX IF EXISTS idx_lectures_course;
DROP INDEX IF EXISTS idx_lectures_section;
DROP INDEX IF EXISTS idx_sections_course;
DROP INDEX IF EXISTS idx_courses_created_at;
DROP INDEX IF EXISTS idx_courses_category;
DROP INDEX IF EXISTS idx_courses_platform;
DROP INDEX IF EXISTS idx_courses_slug;

-- Drop tables in dependency order (foreign keys → references)
DROP TABLE IF EXISTS notes;              -- References lectures, courses
DROP TABLE IF EXISTS course_tags;       -- References courses, tags
DROP TABLE IF EXISTS tags;               -- No dependencies
DROP TABLE IF EXISTS collection_courses; -- References collections, courses
DROP TABLE IF EXISTS collections;       -- No dependencies
DROP TABLE IF EXISTS progress;          -- References lectures, courses
DROP TABLE IF EXISTS subtitles;         -- References lectures
DROP TABLE IF EXISTS lectures;          -- References sections, courses
DROP TABLE IF EXISTS sections;          -- References courses
DROP TABLE IF EXISTS courses;           -- No dependencies
DROP TABLE IF EXISTS app_settings;      -- No dependencies

-- +goose StatementEnd

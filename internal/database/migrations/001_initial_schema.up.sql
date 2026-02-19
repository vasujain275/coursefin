-- +goose Up
-- +goose StatementBegin

-- ============================================================================
-- CourseFin Database Schema - Initial Migration
-- ============================================================================
-- Version: 001
-- Description: Complete initial database schema for CourseFin course management
-- Purpose: Store course metadata, sections, lectures, subtitles, progress, and settings
-- Path Strategy: All file paths are RELATIVE to the library root directory
--                This allows the entire library to be moved without breaking references
-- ============================================================================

-- ============================================================================
-- TABLE: courses
-- ============================================================================
-- Purpose: Primary table storing course-level metadata and information
-- Data Sources:
--   - Filesystem: course folder structure
--   - User Input: manual edits and overrides
-- Path Strategy: course_path is an ABSOLUTE path to the course folder
-- ============================================================================

CREATE TABLE IF NOT EXISTS courses (
    -- Identity & Core Info
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique course identifier
    title TEXT NOT NULL,                                -- Course title (from folder name or manual)
    slug TEXT UNIQUE NOT NULL,                          -- URL-friendly unique identifier (e.g., "full-stack-ai-python")
    description TEXT,                                   -- Long-form course description
    
    -- Instructor Information
    instructor_name TEXT,                               -- Primary instructor name
    
    -- Visual Assets (Images)
    thumbnail_url TEXT,                                 -- Remote thumbnail URL (for re-downloading if needed)
    thumbnail_path TEXT,                                -- Cached local thumbnail (relative path, e.g., ".coursefin/thumbnails/abc123.jpg")
    
    -- Filesystem Reference
    course_path TEXT NOT NULL,                          -- ABSOLUTE path to course folder
                                                        -- This is the actual folder containing all course files
    
    -- Aggregated Metadata (calculated from lectures)
    total_duration INTEGER,                             -- Total course duration in SECONDS (sum of all video lectures)
    total_lectures INTEGER,                             -- Total number of lectures across all sections
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- When this course was first imported to CourseFin
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP      -- When this record was last modified
);

-- ============================================================================
-- TABLE: sections
-- ============================================================================
-- Purpose: Course sections/chapters/modules (hierarchical organization)
-- Data Source: Filesystem folder structure (e.g., "8 - Generators and Decorators/")
-- Relationship: Many sections belong to one course
-- Ordering: section_number defines display order within a course
-- ============================================================================

CREATE TABLE IF NOT EXISTS sections (
    -- Identity
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique section identifier
    course_id INTEGER NOT NULL,                         -- Parent course reference
    
    -- Content
    title TEXT NOT NULL,                                -- Section title (e.g., "Generators and Decorators in Python")
    section_number INTEGER NOT NULL,                    -- Display order within course (1, 2, 3...)
                                                        -- Extracted from folder name (e.g., "8 - Generators" → section_number=8)
    description TEXT,                                   -- Optional section description (future enhancement)
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- When section was first scanned
    
    -- Relationships
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Constraints
    UNIQUE(course_id, section_number)                  -- Prevent duplicate section numbers in same course
);

-- ============================================================================
-- TABLE: lectures
-- ============================================================================
-- Purpose: Individual lecture/lesson files (videos, HTML lectures, quizzes, documents)
-- Data Source: Individual files within section folders
-- File Types:
--   - video: .mp4, .mkv, .webm (main lecture content)
--   - text: .html files without "quiz" in name (reading materials, articles)
--   - quiz: .html files with "quiz" in name (practice tests, assessments)
--   - document: .pdf, .zip, .tar.gz (downloadable resources, code files)
-- Path Strategy: file_path is relative to library root
-- ============================================================================

CREATE TABLE IF NOT EXISTS lectures (
    -- Identity
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique lecture identifier
    section_id INTEGER NOT NULL,                        -- Parent section reference
    course_id INTEGER NOT NULL,                         -- Parent course reference (denormalized for fast queries)
    
    -- Content
    title TEXT NOT NULL,                                -- Lecture title (e.g., "Generators with Yield and Next Methods")
    lecture_number INTEGER NOT NULL,                    -- Display order within section (1, 2, 3...)
                                                        -- Extracted from filename (e.g., "1 -Generators.mp4" → lecture_number=1)
    
    -- Lecture Type & Classification
    lecture_type TEXT NOT NULL CHECK(lecture_type IN ('video', 'text', 'quiz', 'document')),
                                                        -- Type of lecture content
                                                        -- video: playable video file
                                                        -- text: HTML/text reading material
                                                        -- quiz: assessment/practice test
                                                        -- document: downloadable resource
    is_quiz BOOLEAN DEFAULT 0,                         -- Quick flag for quiz lectures (denormalized from lecture_type)
    is_downloadable BOOLEAN DEFAULT 1,                 -- Whether lecture can be downloaded/exported
    
    -- Filesystem References
    file_path TEXT NOT NULL,                            -- RELATIVE path to primary lecture file
                                                        -- (e.g., "Full-Stack AI/8 - Generators/1 -Generators.mp4")
    original_filename TEXT,                             -- Preserve original filename for reference
                                                        -- (useful for debugging parsing issues)
    resources_path TEXT,                                -- RELATIVE path to associated resource files
                                                        -- (e.g., .zip code files, .pdf slides)
    
    -- Video Metadata (populated via ffprobe for video lectures)
    file_size INTEGER,                                  -- File size in BYTES
    duration INTEGER,                                   -- Video duration in SECONDS
    video_codec TEXT,                                   -- Video codec (e.g., "h264", "vp9", "av1")
    resolution TEXT,                                    -- Video resolution (e.g., "1920x1080", "1280x720")
    
    -- Subtitle Support
    has_subtitles BOOLEAN DEFAULT 0,                   -- Denormalized flag: TRUE if subtitles exist in subtitles table
                                                        -- Updated via trigger or application code when subtitles are added/removed
                                                        -- Purpose: Fast queries without joining subtitles table
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- When lecture was first scanned
    
    -- Relationships
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: subtitles
-- ============================================================================
-- Purpose: Store multiple subtitle tracks per lecture (multi-language, multi-format)
-- Data Source: Subtitle files found alongside lecture videos
-- Design Rationale:
--   - Separate table allows multiple languages per lecture (en_US, es_ES, fr_FR)
--   - Supports multiple formats per language (SRT, VTT, ASS)
--   - Easier to query "all English subtitles" or "all subtitles for lecture X"
-- Naming Convention: "1 -Generators.en_US.vtt" → language="en_US", format="vtt"
-- ============================================================================

CREATE TABLE IF NOT EXISTS subtitles (
    -- Identity
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique subtitle track identifier
    lecture_id INTEGER NOT NULL,                        -- Parent lecture reference
    
    -- Subtitle Metadata
    language TEXT NOT NULL,                             -- Language code with locale (e.g., "en_US", "es_ES", "en_GB")
                                                        -- Format: ISO 639-1 (language) + ISO 3166-1 (country)
    format TEXT NOT NULL CHECK(format IN ('srt', 'vtt', 'ass', 'sub')),
                                                        -- Subtitle file format
                                                        -- srt: SubRip (most common)
                                                        -- vtt: WebVTT (web standard)
                                                        -- ass: Advanced SubStation Alpha (styled)
                                                        -- sub: MicroDVD/SubViewer (legacy)
    
    -- Filesystem Reference
    file_path TEXT NOT NULL,                            -- RELATIVE path to subtitle file
                                                        -- (e.g., "Full-Stack AI/8 - Generators/1 -Generators.en_US.vtt")
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- When subtitle was discovered
    
    -- Relationships
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
    
    -- Constraints
    UNIQUE(lecture_id, language, format)               -- One file per lecture per language per format
                                                        -- Allows: en_US.srt + en_US.vtt (different formats)
                                                        -- Prevents: duplicate en_US.srt files
);

-- ============================================================================
-- TABLE: progress
-- ============================================================================
-- Purpose: Track user watch progress for each lecture
-- Features:
--   - Resume playback from last position
--   - Track completion status
--   - Calculate completion percentage
--   - Record watch statistics (watch count, dates)
-- Update Strategy: Updated in real-time during video playback (every 5-10 seconds)
-- ============================================================================

CREATE TABLE IF NOT EXISTS progress (
    -- Identity
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique progress record identifier
    lecture_id INTEGER NOT NULL,                        -- Which lecture this progress is for
    course_id INTEGER NOT NULL,                         -- Which course (denormalized for fast course-level queries)
    
    -- Playback Progress
    watched_duration INTEGER DEFAULT 0,                 -- Total seconds watched (can exceed total_duration if rewatched)
    total_duration INTEGER,                             -- Video duration in seconds (cached from lectures.duration)
    last_position INTEGER DEFAULT 0,                   -- Last playback position in SECONDS (for resume functionality)
                                                        -- Resume Strategy: Start from last_position if < total_duration - 30s
    
    -- Completion Status
    completed BOOLEAN DEFAULT 0,                       -- TRUE if lecture marked as complete
                                                        -- Completion Criteria: last_position >= (total_duration * 0.90)
                                                        -- Allows marking 90%+ as "completed" (skip credits/outros)
    
    -- Watch Statistics
    watch_count INTEGER DEFAULT 0,                     -- Number of times lecture was played
                                                        -- Increments on each play (not on resume)
    first_watched_at DATETIME,                         -- Timestamp of first play
    last_watched_at DATETIME,                          -- Timestamp of most recent play/resume
    
    -- Timestamps
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- Last progress update (for sorting "recently watched")
    
    -- Relationships
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Constraints
    UNIQUE(lecture_id)                                 -- One progress record per lecture (use UPSERT pattern)
);

-- ============================================================================
-- TABLE: collections (POST-MVP)
-- ============================================================================
-- Purpose: User-created playlists/collections of courses
-- Examples: "Machine Learning Courses", "Frontend Development", "Work Training"
-- Features:
--   - Group related courses
--   - Custom thumbnails
--   - Multiple courses can be in multiple collections (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS collections (
    -- Identity
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique collection identifier
    
    -- Content
    name TEXT NOT NULL,                                 -- Collection name (e.g., "Machine Learning Track")
    description TEXT,                                   -- Optional description
    thumbnail_path TEXT,                                -- Custom collection thumbnail (relative path)
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- When collection was created
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP      -- When collection was last modified
);

-- ============================================================================
-- TABLE: collection_courses (POST-MVP)
-- ============================================================================
-- Purpose: Many-to-many relationship between collections and courses
-- Design: Junction table with composite primary key
-- ============================================================================

CREATE TABLE IF NOT EXISTS collection_courses (
    collection_id INTEGER NOT NULL,                    -- Which collection
    course_id INTEGER NOT NULL,                         -- Which course
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- When course was added to collection
    
    -- Relationships
    PRIMARY KEY (collection_id, course_id),            -- Composite key prevents duplicates
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: tags (POST-MVP)
-- ============================================================================
-- Purpose: Flexible tagging system for categorization
-- Examples: "python", "aws", "backend", "certification", "udemy-2024"
-- Features:
--   - User-created tags
--   - Multiple tags per course (many-to-many)
--   - Tag-based filtering and search
-- ============================================================================

CREATE TABLE IF NOT EXISTS tags (
    -- Identity
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique tag identifier
    
    -- Content
    name TEXT UNIQUE NOT NULL,                          -- Tag name (e.g., "python", "machine-learning")
                                                        -- UNIQUE constraint ensures no duplicate tags
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP      -- When tag was first created
);

-- ============================================================================
-- TABLE: course_tags (POST-MVP)
-- ============================================================================
-- Purpose: Many-to-many relationship between courses and tags
-- Design: Junction table with composite primary key
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_tags (
    course_id INTEGER NOT NULL,                         -- Which course
    tag_id INTEGER NOT NULL,                            -- Which tag
    
    -- Relationships
    PRIMARY KEY (course_id, tag_id),                   -- Composite key prevents duplicate tags on same course
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: notes (FUTURE FEATURE)
-- ============================================================================
-- Purpose: User notes/annotations attached to specific lecture timestamps
-- Use Cases:
--   - Take notes at specific video positions
--   - Mark important sections
--   - Create study materials
-- Features:
--   - Timestamp-based notes (can jump to position)
--   - Full-text note content (markdown support possible)
--   - Export notes per course/lecture
-- ============================================================================

CREATE TABLE IF NOT EXISTS notes (
    -- Identity
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique note identifier
    lecture_id INTEGER NOT NULL,                        -- Which lecture
    course_id INTEGER NOT NULL,                         -- Which course (denormalized for fast queries)
    
    -- Content
    timestamp INTEGER,                                  -- Position in video (SECONDS) where note was taken
                                                        -- NULL = note applies to entire lecture
    content TEXT NOT NULL,                              -- Note content (supports plain text or markdown)
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- When note was created
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- When note was last edited
    
    -- Relationships
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: app_settings
-- ============================================================================
-- Purpose: Application-wide configuration and preferences (key-value store)
-- Design: Flexible key-value pairs for easy extension
-- Usage: Load all settings on app startup, cache in memory
-- Important Keys:
--   - courses_directory: Absolute path to library root (all relative paths computed from here)
--   - theme: "light" | "dark" | "system"
--   - default_playback_speed: 1.0, 1.25, 1.5, 2.0
--   - auto_mark_complete_threshold: 0.90 (90% watched = complete)
--   - subtitle_language_preference: "en_US,es_ES" (comma-separated priority)
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
    -- Identity & Content
    key TEXT PRIMARY KEY,                              -- Setting key (unique identifier)
    value TEXT NOT NULL,                                -- Setting value (stored as TEXT, parse as needed)
                                                        -- Examples:
                                                        --   key="theme", value="dark"
                                                        --   key="default_playback_speed", value="1.5"
                                                        --   key="courses_directory", value="/home/user/courses"
    
    -- Timestamps
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP      -- When setting was last changed
);

-- ============================================================================
-- INDEXES - Performance Optimization
-- ============================================================================
-- Purpose: Speed up common query patterns
-- Strategy: Index foreign keys, frequently filtered columns, and sort columns
-- Trade-off: Faster reads, slightly slower writes (acceptable for read-heavy app)
-- ============================================================================

-- Course Indexes
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);  -- For "recently added" sorting

-- Section Indexes
CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id, section_number);  -- Composite for ordered section listing

-- Lecture Indexes
CREATE INDEX IF NOT EXISTS idx_lectures_section ON lectures(section_id, lecture_number);  -- Composite for ordered lecture listing
CREATE INDEX IF NOT EXISTS idx_lectures_course ON lectures(course_id);  -- For course-wide lecture queries
CREATE INDEX IF NOT EXISTS idx_lectures_type ON lectures(lecture_type);  -- Filter by video/text/quiz/document
CREATE INDEX IF NOT EXISTS idx_lectures_course_section ON lectures(course_id, section_id);  -- Fast course structure queries

-- Subtitle Indexes
CREATE INDEX IF NOT EXISTS idx_subtitles_lecture ON subtitles(lecture_id);  -- Get all subtitles for a lecture
CREATE INDEX IF NOT EXISTS idx_subtitles_language ON subtitles(language);  -- Filter by language preference

-- Progress Indexes
CREATE INDEX IF NOT EXISTS idx_progress_lecture ON progress(lecture_id);  -- Fast lookup by lecture
CREATE INDEX IF NOT EXISTS idx_progress_course ON progress(course_id);  -- Course-level progress aggregation
CREATE INDEX IF NOT EXISTS idx_progress_completed ON progress(completed);  -- Filter completed/incomplete
CREATE INDEX IF NOT EXISTS idx_progress_updated_at ON progress(updated_at DESC);  -- "Recently watched" sorting
CREATE INDEX IF NOT EXISTS idx_progress_course_completed ON progress(course_id, completed);  -- Course completion stats

-- Collection Indexes (POST-MVP)
CREATE INDEX IF NOT EXISTS idx_collection_courses_collection ON collection_courses(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_courses_course ON collection_courses(course_id);

-- Tag Indexes (POST-MVP)
CREATE INDEX IF NOT EXISTS idx_course_tags_course ON course_tags(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tags_tag ON course_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);  -- Tag search/autocomplete

-- Note Indexes (FUTURE)
CREATE INDEX IF NOT EXISTS idx_notes_lecture ON notes(lecture_id, timestamp);  -- Get notes for lecture, ordered by timestamp
CREATE INDEX IF NOT EXISTS idx_notes_course ON notes(course_id);  -- Course-wide note queries

-- ============================================================================
-- DEFAULT DATA - Essential Settings
-- ============================================================================
-- Purpose: Pre-populate app_settings with sensible defaults
-- Note: courses_directory will be set on first launch via file picker
-- ============================================================================

INSERT INTO app_settings (key, value) VALUES
    ('first_run', 'true'),                            -- Indicates app needs onboarding
    ('theme', 'system'),                               -- Follow system theme by default
    ('default_playback_speed', '1.0'),                -- Normal speed
    ('auto_mark_complete_threshold', '0.90'),         -- 90% watched = complete
    ('subtitle_language_preference', 'en_US,en'),     -- Prefer US English, fallback to English
    ('auto_play_next', 'true'),                       -- Auto-play next lecture after completion
    ('resume_prompt', 'true'),                        -- Ask before resuming (vs auto-resume)
    ('thumbnail_cache_enabled', 'true'),              -- Cache Udemy thumbnails locally
    ('scan_on_startup', 'false');                     -- Don't auto-scan library on startup (performance)

-- +goose StatementEnd

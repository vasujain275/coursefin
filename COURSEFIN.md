# COURSEFIN - Project Specification

**Version:** 1.0.0  
**Last Updated:** February 18, 2026  
**Status:** Planning Phase

---

## ⚠️ IMPORTANT CONTEXT

**CourseFin is a DESKTOP APPLICATION built with Wails v2.11.0**

This is NOT a web application. Key architectural considerations:

- **Desktop-Native**: Built with Wails, which combines Go backend with web frontend (React) to create native desktop applications
- **No Server/API**: Frontend communicates with Go backend through Wails bindings (RPC-like calls), NOT HTTP/REST APIs
- **Native APIs**: Access to native file system, dialogs, and OS features through Wails runtime
- **Single Binary**: Compiles to a standalone executable with embedded frontend assets
- **Cross-Platform**: One codebase produces native apps for Linux, Windows, and macOS

When reading this specification or generating code, remember:
- Use `Wails` bindings for backend communication (not `fetch` or `axios`)
- Leverage native file dialogs and OS integration
- Think "desktop app" not "web app" (no URLs, hosting, CORS, etc.)

---

## 1. Project Overview

### 1.1 Vision
CourseFin is a **native desktop application** that provides a beautiful, Jellyfin-inspired interface for managing and viewing locally downloaded Udemy courses. Built with **Wails v2.11.0** (Go + React), it transforms scattered course files into an organized, Netflix-like learning experience with progress tracking, metadata management, and a powerful media player.

### 1.2 Goals
- **Single Binary Distribution**: No external dependencies required (MPV bundled)
- **Cross-Platform**: Works seamlessly on Linux, Windows, and macOS
- **Minimal & Elegant**: Jellyfin-inspired UI with clean, modern design
- **Fully Local**: No cloud dependencies, all data stored locally in SQLite
- **Professional Playback**: High-quality video playback with MPV integration
- **Smart Metadata**: Automatic course information fetching from Udemy

### 1.3 Target Users
- Students with downloaded Udemy courses
- Professionals managing technical training libraries
- Self-learners who prefer offline course access

---

## 2. Technical Stack

### 2.1 Frontend (Embedded in Wails)
- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.4+ (integrated with Wails build)
- **Styling**: Tailwind CSS v4.1+
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: lucide-react + @heroicons/react
- **State Management**: Zustand
- **Routing**: React Router v6 (post-MVP, though less critical in desktop context)
- **Backend Communication**: Wails generated bindings (NOT fetch/axios)
  - Located in: `frontend/wailsjs/go/main/*.js`
  - Auto-generated from Go struct methods

### 2.2 Backend (Go with Wails)
- **Language**: Go 1.23+
- **Framework**: Wails v2.11.0 (desktop application framework)
  - Provides: Frontend ↔ Backend communication via bindings
  - Native: File dialogs, system notifications, menu bar integration
  - Runtime: Window management, events, logging
- **Architecture**: Pragmatic Clean Architecture (see [ARCHITECTURE.md](./ARCHITECTURE.md))
  - **Database Layer**: sqlc (type-safe SQL) + goose (migrations)
  - **Repository Pattern**: Interfaces with sqlc Querier pattern
  - **Service Layer**: Domain-driven services (CourseService, PlayerService, etc.)
  - **Dependency Injection**: Manual DI with constructor functions
- **Database**: SQLite with modernc.org/sqlite (pure Go, no CGO)
- **Video Player**: MPV (bundled binary + IPC control)
- **Web Scraping**: goquery for Udemy metadata extraction
- **HTTP Client**: Go standard library net/http

> 📖 **For detailed backend architecture**, including sqlc setup, repository patterns, service layer organization, and code examples, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**

### 2.3 Database
- **Engine**: SQLite3
- **Driver**: modernc.org/sqlite (pure Go, no CGO required)
- **Query Layer**: sqlc (generates type-safe Go code from SQL)
- **Migrations**: goose with numbered migrations
- **Location**: User's app data directory (`~/.local/share/coursefin` on Linux, `AppData/Roaming/coursefin` on Windows, `~/Library/Application Support/coursefin` on macOS)

### 2.4 Wails Integration

**How Wails Connects Frontend & Backend:**

1. **Bindings Generation**: 
   - Wails auto-generates TypeScript/JavaScript bindings from exported Go methods
   - Located in `frontend/wailsjs/go/main/App.js`
   - Provides type-safe frontend → backend communication

2. **Communication Flow**:
   ```
   React Component → Wails Binding → Go Method → Database/File System
   ```

3. **Example**:
   ```go
   // Go backend (app.go)
   func (a *App) GetAllCourses() ([]Course, error) {
       return a.db.GetCourses()
   }
   ```
   
   ```tsx
   // React frontend
   import { GetAllCourses } from '@/wailsjs/go/main/App';
   
   const courses = await GetAllCourses();  // Type-safe RPC call
   ```

4. **Native Features Available**:
   - File/folder selection dialogs
   - System notifications
   - Window control (minimize, maximize, close)
   - Context menus
   - System tray integration (future)

**Important**: DO NOT use `fetch()`, `axios`, or HTTP requests for backend communication. Always use Wails bindings.

### 2.5 Video Player Integration
- **Player**: MPV (bundled with application)
- **Communication**: IPC socket (JSON-based commands)
- **Video Formats**: MP4, MKV, WebM, AVI (common formats)
- **Subtitle Support**: SRT, VTT, ASS
- **Bundling Strategy**: Platform-specific MPV binaries embedded in build, extracted on first run

---

## 3. System Architecture

### 3.1 Application Structure
```
CourseFin Desktop App
├── Frontend (React + TypeScript)
│   ├── UI Components (shadcn/ui)
│   ├── Views (Library, Player, Settings)
│   └── Wails Bindings
├── Backend (Go)
│   ├── Course Service (import, metadata, scan)
│   ├── Database Service (SQLite operations)
│   ├── Player Service (MPV IPC control)
│   ├── Scraper Service (Udemy metadata)
│   └── Settings Service (app configuration)
└── Data Layer
    ├── SQLite Database
    ├── MPV Binary (bundled)
    └── User Files (courses directory)
```

### 3.2 Component Responsibilities

#### Frontend Components
1. **Library View**: Grid display of courses with posters
2. **Course Detail View**: Course info, sections, lectures list
3. **Player View**: Video player with controls and progress
4. **Settings View**: Configure courses directory, Udemy integration
5. **Import Dialog**: Add new courses with metadata fetching

#### Backend Services
1. **CourseService**
   - Scan course directories
   - Parse course structure (sections/videos)
   - Manage course metadata
   - Handle course import flow

2. **DatabaseService**
   - CRUD operations for all entities
   - Progress tracking queries
   - Search and filtering
   - Data export/backup

3. **PlayerService**
   - Launch MPV subprocess with IPC
   - Send playback commands (play, pause, seek)
   - Monitor playback position
   - Handle player events

4. **ScraperService**
   - Extract metadata from Udemy URL
   - Parse course title, instructor, description
   - Download course thumbnail/poster
   - Handle rate limiting and errors

5. **SettingsService**
   - Manage app configuration
   - Handle courses directory path
   - Store user preferences

---

## 4. Database Schema

### 4.1 Core Tables

#### `courses`
```sql
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    instructor_name TEXT,
    instructor_bio TEXT,
    thumbnail_url TEXT,
    thumbnail_path TEXT,  -- Local cached image
    udemy_url TEXT UNIQUE,
    platform TEXT DEFAULT 'udemy',  -- Future: coursera, pluralsight
    course_path TEXT NOT NULL,  -- Filesystem path
    total_duration INTEGER,  -- Total seconds
    total_lectures INTEGER,
    rating REAL,
    enrolled_students INTEGER,
    language TEXT,
    category TEXT,
    subcategory TEXT,
    level TEXT,  -- Beginner, Intermediate, Advanced, All Levels
    last_updated DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `sections`
```sql
CREATE TABLE sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    section_number INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(course_id, section_number)
);
```

#### `lectures`
```sql
CREATE TABLE lectures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    lecture_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    duration INTEGER,  -- Seconds
    video_codec TEXT,
    resolution TEXT,  -- e.g., "1920x1080"
    has_subtitles BOOLEAN DEFAULT 0,
    subtitle_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

#### `progress`
```sql
CREATE TABLE progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lecture_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    watched_duration INTEGER DEFAULT 0,  -- Seconds watched
    total_duration INTEGER,  -- Video duration
    last_position INTEGER DEFAULT 0,  -- Resume position
    completed BOOLEAN DEFAULT 0,
    watch_count INTEGER DEFAULT 0,
    first_watched_at DATETIME,
    last_watched_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(lecture_id)
);
```

#### `collections`
```sql
CREATE TABLE collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `collection_courses`
```sql
CREATE TABLE collection_courses (
    collection_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, course_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

#### `tags`
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `course_tags`
```sql
CREATE TABLE course_tags (
    course_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (course_id, tag_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

#### `notes` (Future)
```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lecture_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    timestamp INTEGER,  -- Position in video
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

#### `app_settings`
```sql
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Indexes
```sql
CREATE INDEX idx_courses_platform ON courses(platform);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_sections_course ON sections(course_id);
CREATE INDEX idx_lectures_section ON lectures(section_id);
CREATE INDEX idx_lectures_course ON lectures(course_id);
CREATE INDEX idx_progress_course ON progress(course_id);
CREATE INDEX idx_progress_lecture ON progress(lecture_id);
CREATE INDEX idx_progress_completed ON progress(completed);
CREATE INDEX idx_collection_courses_course ON collection_courses(course_id);
CREATE INDEX idx_course_tags_tag ON course_tags(tag_id);
```

### 4.3 Initial Settings
```sql
INSERT INTO app_settings (key, value) VALUES
    ('courses_directory', ''),
    ('theme', 'dark'),
    ('default_playback_speed', '1.0'),
    ('auto_mark_complete_threshold', '90'),  -- 90% watched = complete
    ('mpv_path', ''),
    ('first_run', 'true');
```

---

## 5. Core Features (MVP)

### 5.1 Initial Setup & Configuration

**User Flow:**
1. First launch: Welcome screen
2. User selects courses library directory (where all courses are stored)
3. App saves path to settings
4. App initializes MPV binary (extracts from bundle if needed)

**Technical Implementation:**
- Use Wails runtime for native folder selection dialog
- Store configuration in `app_settings` table
- Validate directory permissions
- Extract bundled MPV binary to app data directory
- Verify MPV executable works

**UI Components:**
- Welcome screen with setup wizard
- Folder selection button
- Progress indicator for MPV extraction
- Success confirmation

### 5.2 Course Import

**User Flow:**
1. User clicks "Add Course" button
2. Dialog opens showing subfolders of the courses library directory
3. User selects a course subfolder
4. User selects platform (Udemy for MVP)
5. User enters Udemy course URL
6. App scrapes metadata and downloads thumbnail
7. App scans folder structure for videos
8. Course appears in library

**Technical Implementation:**
1. **Folder Scanning:**
   - Read directory structure
   - Identify sections (folders) and lectures (video files)
   - Parse video metadata (duration, resolution, codec) using ffprobe or Go library
   - Detect subtitle files (.srt, .vtt, .ass)

2. **Udemy Scraping:**
   - Parse Udemy URL (extract course slug)
   - HTTP GET request to course page
   - Use goquery to extract:
     - Course title
     - Instructor name
     - Description
     - Thumbnail/poster URL
     - Rating, students, duration
     - Category, level
   - Download and cache thumbnail locally
   - Handle errors gracefully (fallback to manual entry)

3. **Database Operations:**
   - Begin transaction
   - Insert course record
   - Insert sections
   - Insert lectures with file paths
   - Commit transaction
   - Handle duplicates (check slug/path)

**Expected Folder Structure:**
```
/courses/my-course/
├── Section 1 - Introduction/
│   ├── 001 Welcome to the Course.mp4
│   ├── 001 Welcome to the Course.srt
│   └── 002 Course Overview.mp4
├── Section 2 - Getting Started/
│   ├── 003 Setting Up.mp4
│   └── 004 First Project.mp4
└── poster.jpg (optional)
```

**Parsing Logic:**
- Folders = Sections (ordered alphabetically or by number prefix)
- Video files = Lectures (ordered by filename)
- Extract lecture number from filename (e.g., "001", "1-", "Lecture 1")
- Associate subtitle files with videos by matching names

**UI Components:**
- Import dialog with stepper
- Folder browser
- URL input field
- Loading spinner during scraping
- Error messages with retry option
- Success confirmation with "View Course" button

### 5.3 Library View (Grid)

**User Flow:**
1. User opens app (after setup)
2. Library view displays all courses in grid layout
3. Each card shows: thumbnail, title, instructor, progress bar
4. User can click card to open course detail view

**Technical Implementation:**
- Query all courses from database with calculated progress
- Calculate course completion percentage:
  ```sql
  SELECT 
    c.*,
    COUNT(DISTINCT l.id) as total_lectures,
    COUNT(DISTINCT CASE WHEN p.completed = 1 THEN l.id END) as completed_lectures,
    (COUNT(DISTINCT CASE WHEN p.completed = 1 THEN l.id END) * 100.0 / COUNT(DISTINCT l.id)) as progress_percent
  FROM courses c
  LEFT JOIN lectures l ON l.course_id = c.id
  LEFT JOIN progress p ON p.lecture_id = l.id
  GROUP BY c.id
  ```
- Load thumbnails from local cache
- Sort options: Recently added, Recently watched, Title A-Z, Progress

**UI Components:**
- Responsive grid (CSS Grid with auto-fit/minmax)
- Course card component with:
  - Poster image (16:9 or 2:3 aspect ratio)
  - Title overlay
  - Instructor name
  - Progress bar at bottom
  - Hover effects (scale, shadow)
- Empty state for no courses
- "Add Course" button in top bar

**Grid Layout:**
- Desktop: 4-6 columns
- Tablet: 2-3 columns
- Mobile: 1-2 columns
- Card size: ~250-300px width

### 5.4 Course Detail View

**User Flow:**
1. User clicks course card
2. Detail view shows:
   - Large poster/banner
   - Course metadata (title, instructor, rating, duration)
   - Description
   - List of sections with lectures
   - Progress indicator
3. User clicks lecture to start playback

**Technical Implementation:**
- Query course with all sections and lectures:
  ```sql
  SELECT c.*, s.*, l.*, p.*
  FROM courses c
  LEFT JOIN sections s ON s.course_id = c.id
  LEFT JOIN lectures l ON l.section_id = s.id
  LEFT JOIN progress p ON p.lecture_id = l.id
  WHERE c.id = ?
  ORDER BY s.section_number, l.lecture_number
  ```
- Group lectures by section
- Calculate section progress
- Format durations (seconds to HH:MM:SS)

**UI Components:**
- Hero section with poster and metadata
- Expandable/collapsible sections (accordion)
- Lecture list with:
  - Lecture number and title
  - Duration
  - Checkmark if completed
  - Resume indicator if partially watched
  - Play button on hover
- Back button to library
- Edit/Delete course buttons

### 5.5 Video Player

**User Flow:**
1. User clicks lecture
2. Player view opens
3. Video starts playing (or resumes from last position)
4. User can control playback with on-screen controls
5. Progress is automatically saved
6. User can navigate to next/previous lecture

**Technical Implementation:**

**MPV Integration:**
1. **Initialization:**
   - Start MPV process with IPC enabled:
     ```bash
     mpv --input-ipc-server=/tmp/coursefin-mpv-socket --idle --force-window video.mp4
     ```
   - Connect to IPC socket (Unix socket or named pipe on Windows)
   - Send JSON commands over socket

2. **Playback Control:**
   - Play/Pause: `{"command": ["set_property", "pause", false]}`
   - Seek: `{"command": ["seek", 30, "relative"]}`
   - Volume: `{"command": ["set_property", "volume", 50]}`
   - Get position: `{"command": ["get_property", "time-pos"]}`

3. **Progress Tracking:**
   - Poll playback position every 5 seconds
   - Update `progress` table with current position
   - Mark as complete when position > 90% of duration
   - Save on pause, seek, or player close

4. **Event Handling:**
   - Listen for MPV property changes
   - Handle file-loaded, playback-restart, end-file events
   - Auto-play next lecture on completion (optional)

**UI Components:**
- Video container (MPV window embedded or separate)
- Custom controls overlay:
  - Play/pause button
  - Timeline scrubber
  - Current time / Total time
  - Volume slider
  - Fullscreen button
  - Next/Previous lecture buttons
- Lecture title display
- Section/course navigation sidebar
- Keyboard shortcuts info

**Keyboard Shortcuts (MVP):**
- Space: Play/Pause
- Left/Right Arrow: Seek ±10 seconds
- Up/Down Arrow: Volume ±5%
- F: Fullscreen
- N: Next lecture
- P: Previous lecture
- Esc: Exit fullscreen or close player

### 5.6 Progress Tracking

**Technical Implementation:**
1. **Update Progress:**
   ```go
   func UpdateProgress(lectureID int, position int, duration int) {
       completed := float64(position) / float64(duration) > 0.9
       
       query := `
           INSERT INTO progress (lecture_id, course_id, last_position, watched_duration, total_duration, completed, last_watched_at)
           VALUES (?, (SELECT course_id FROM lectures WHERE id = ?), ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(lecture_id) DO UPDATE SET
               last_position = excluded.last_position,
               watched_duration = MAX(watched_duration, excluded.watched_duration),
               completed = excluded.completed,
               watch_count = watch_count + 1,
               last_watched_at = CURRENT_TIMESTAMP
       `
       db.Exec(query, lectureID, lectureID, position, position, duration, completed)
   }
   ```

2. **Resume Playback:**
   - Query last_position for lecture
   - Start MPV at that position
   - Show "Resume from X:XX" option

3. **Course Progress Calculation:**
   - Completed lectures / Total lectures = Progress %
   - Display in course card and detail view

---

## 6. Future Features (Post-MVP)

### 6.1 Search & Filtering
- Full-text search across course titles, instructors, descriptions
- Filter by: Category, Level, Progress status, Platform
- Sort by: Date added, Last watched, Title, Rating
- SQLite FTS5 for fast search

### 6.2 Collections/Playlists
- Create custom collections (e.g., "Web Development", "Career Goals")
- Add courses to multiple collections
- Collection view in library

### 6.3 Theme System
- Dark theme (default)
- Light theme
- System theme detection
- Custom accent colors
- Stored in app_settings

### 6.4 Advanced Analytics
- Watch time statistics (daily, weekly, monthly)
- Course completion rate
- Learning streak tracking
- Heatmap visualization
- Export reports

### 6.5 Note-Taking
- Timestamped notes during playback
- Rich text editor
- Notes view per lecture
- Search notes
- Export notes to Markdown

### 6.6 Subtitle Support
- Load external subtitle files
- Toggle subtitles on/off
- Subtitle delay adjustment
- Multiple subtitle tracks

### 6.7 Playback Speed Control
- Speed presets: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
- Custom speed input
- Persist per user or per course

### 6.8 Export/Backup
- Export course data to JSON
- Backup progress and notes
- Import from backup
- Export watch history

### 6.9 Additional Features
- Picture-in-picture mode
- Bookmarks/chapters
- Course recommendations
- Multi-platform support (Coursera, Pluralsight)
- Cloud sync (optional)

---

## 7. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Set up project structure and core infrastructure

**Tasks:**
1. Initialize project structure
2. Set up Go backend with Wails
3. Configure frontend with React, TypeScript, Tailwind
4. Add shadcn/ui components
5. Implement database layer:
   - Create schema
   - Migration system
   - Basic CRUD operations
6. MPV binary bundling system:
   - Download MPV binaries for each platform
   - Embed in Go binary or package with app
   - Extract to app data directory
   - Test MPV IPC communication

**Deliverable:** Basic app shell with database and MPV working

### Phase 2: Course Management (Weeks 3-4)
**Goal:** Import and display courses

**Tasks:**
1. Implement SettingsService:
   - First-run setup flow
   - Courses directory selection
   - Settings persistence
2. Implement CourseService:
   - Folder scanning logic
   - Section/lecture detection
   - Video metadata extraction (use ffprobe wrapper)
3. Implement ScraperService:
   - Udemy URL parsing
   - HTML scraping with goquery
   - Metadata extraction
   - Thumbnail download
4. Build Import Dialog UI:
   - Folder picker
   - URL input
   - Progress indicators
   - Error handling
5. Build Library View:
   - Grid layout
   - Course cards
   - Empty state
6. Build Course Detail View:
   - Course info display
   - Section/lecture list
   - Progress display

**Deliverable:** Users can import and browse courses

### Phase 3: Video Playback (Weeks 5-6)
**Goal:** Play videos with progress tracking

**Tasks:**
1. Implement PlayerService:
   - MPV process management
   - IPC communication
   - Command sending
   - Event handling
   - Progress polling
2. Build Player View UI:
   - Video container
   - Custom controls
   - Timeline scrubber
   - Lecture navigation
3. Implement progress tracking:
   - Save position periodically
   - Mark as complete logic
   - Resume functionality
4. Keyboard shortcuts
5. Next/Previous lecture navigation
6. Error handling (missing files, MPV crashes)

**Deliverable:** Fully functional video player with progress tracking

### Phase 4: Polish & Testing (Week 7)
**Goal:** Bug fixes, optimization, and UX improvements

**Tasks:**
1. Cross-platform testing (Linux, Windows, macOS)
2. Performance optimization:
   - Database query optimization
   - UI rendering performance
   - Large library handling
3. Error handling improvements
4. UI/UX polish:
   - Loading states
   - Animations
   - Responsive design
5. Documentation:
   - User guide
   - Installation instructions
   - Developer documentation

**Deliverable:** MVP ready for release

### Phase 5: Post-MVP Features (Weeks 8+)
**Goal:** Implement advanced features

**Tasks:**
1. Search & filtering
2. Collections
3. Theme system
4. Advanced analytics
5. Note-taking
6. Additional enhancements based on user feedback

---

## 8. Technical Challenges & Solutions

### 8.1 MPV Binary Distribution

**Challenge:** Bundling MPV without requiring users to install it

**Solutions:**
1. **Option A: Embed and Extract (Recommended)**
   - Embed platform-specific MPV binaries in Go using `//go:embed`
   - On first run, extract to app data directory
   - Pros: True single binary, easy distribution
   - Cons: Larger binary size (~50-100MB)

2. **Option B: Separate Download**
   - Download MPV on first run from GitHub releases
   - Pros: Smaller initial binary
   - Cons: Requires internet on first run, more complex

**Implementation:**
```go
//go:embed binaries/mpv-linux binaries/mpv.exe binaries/mpv-darwin
var mpvBinaries embed.FS

func ExtractMPV() error {
    appDir := GetAppDataDir()
    mpvPath := filepath.Join(appDir, "mpv", GetMPVBinaryName())
    
    if _, err := os.Stat(mpvPath); err == nil {
        return nil // Already extracted
    }
    
    data, _ := mpvBinaries.ReadFile("binaries/" + GetMPVBinaryName())
    os.MkdirAll(filepath.Dir(mpvPath), 0755)
    os.WriteFile(mpvPath, data, 0755)
    return nil
}
```

### 8.2 MPV IPC Communication

**Challenge:** Controlling MPV from Go

**Solution:**
- Use Unix sockets (Linux/macOS) or named pipes (Windows)
- JSON-RPC protocol
- Create wrapper library for common commands

**Example:**
```go
type MPVController struct {
    conn net.Conn
}

func (m *MPVController) SendCommand(cmd []interface{}) error {
    payload := map[string]interface{}{"command": cmd}
    data, _ := json.Marshal(payload)
    _, err := m.conn.Write(append(data, '\n'))
    return err
}

func (m *MPVController) Play() error {
    return m.SendCommand([]interface{}{"set_property", "pause", false})
}

func (m *MPVController) GetPosition() (float64, error) {
    m.SendCommand([]interface{}{"get_property", "time-pos"})
    // Parse response...
}
```

### 8.3 Udemy Scraping Reliability

**Challenge:** Web scraping can break with site changes

**Solutions:**
1. Graceful degradation: Allow manual metadata entry if scraping fails
2. Multiple scraping strategies (try different selectors)
3. Cache scraped data to avoid repeated requests
4. Rate limiting to avoid detection
5. Consider using Udemy affiliate API if available

**Fallback Flow:**
```
1. Try scraping
2. If fails, check cache
3. If no cache, prompt for manual entry
4. Store whatever data is available
```

### 8.4 Large Video Libraries Performance

**Challenge:** Thousands of courses could slow down the app

**Solutions:**
1. **Database Optimization:**
   - Proper indexes
   - Pagination/lazy loading
   - Aggregate queries for statistics

2. **UI Optimization:**
   - Virtual scrolling for large lists
   - Lazy load thumbnails
   - Debounce search inputs

3. **Background Processing:**
   - Import courses in background
   - Update progress asynchronously
   - Cache computed values

### 8.5 Cross-Platform File Paths

**Challenge:** Different path separators and conventions

**Solutions:**
- Use Go's `filepath` package (handles platform differences)
- Store paths with forward slashes in DB, convert on read
- Use `filepath.Clean()` to normalize paths
- Test on all platforms

### 8.6 Video Metadata Extraction

**Challenge:** Extracting duration, resolution without playing video

**Solutions:**
1. **Option A: ffprobe**
   - Bundle ffprobe with app
   - Execute and parse JSON output
   - Pros: Accurate, comprehensive
   - Cons: Extra binary dependency

2. **Option B: Go library (github.com/vansante/go-ffprobe)**
   - Pure Go wrapper for ffprobe
   - Still requires ffprobe binary

3. **Option C: Approximate from file (simpler)**
   - Skip detailed metadata for MVP
   - Show duration from progress table
   - Add full metadata in post-MVP

**Recommendation:** Option A/B for better UX, bundle ffprobe with MPV

---

## 9. File Structure

> 📖 **For detailed backend structure**, see [ARCHITECTURE.md](./ARCHITECTURE.md) Section 4

```
coursefin/
├── main.go                           # Entry point, DI wiring
├── app.go                            # Wails App struct (exposed methods)
├── wails.json                        # Wails configuration
├── sqlc.yaml                         # sqlc configuration
├── go.mod
├── go.sum
│
├── ARCHITECTURE.md                   # Backend architecture guide
├── STYLE-GUIDE.md                    # Frontend style guide
├── PLAN.md                           # Development roadmap
│
├── migrations/                       # goose database migrations
│   ├── 001_initial_schema.up.sql
│   ├── 001_initial_schema.down.sql
│   ├── 002_add_indexes.up.sql
│   └── 002_add_indexes.down.sql
│
├── queries/                          # SQL queries for sqlc
│   ├── courses.sql
│   ├── lectures.sql
│   ├── progress.sql
│   └── settings.sql
│
├── internal/                         # Private application code
│   ├── domain/                       # Core entities & interfaces
│   │   ├── course.go                 # Domain entities
│   │   ├── progress.go
│   │   ├── errors.go                 # Domain errors
│   │   └── repository.go             # Repository interfaces
│   │
│   ├── course/                       # Course feature module
│   │   ├── repository.go             # CourseRepository impl
│   │   ├── service.go                # Business logic
│   │   ├── scanner.go                # Folder scanning
│   │   └── dto.go                    # DTOs for Wails
│   │
│   ├── player/                       # Player feature module
│   │   ├── service.go                # PlayerService
│   │   ├── mpv.go                    # MPV IPC controller
│   │   └── extractor.go              # Binary extraction
│   │
│   ├── progress/                     # Progress tracking
│   │   ├── repository.go
│   │   └── service.go
│   │
│   ├── scraper/                      # Udemy metadata scraper
│   │   ├── service.go
│   │   └── udemy.go
│   │
│   ├── settings/                     # App settings
│   │   ├── repository.go
│   │   └── service.go
│   │
│   ├── sqlc/                         # Generated sqlc code
│   │   ├── db.go                     # DBTX interface
│   │   ├── models.go                 # Generated models
│   │   ├── querier.go                # Querier interface
│   │   └── *.sql.go                  # Generated queries
│   │
│   └── infrastructure/               # External integrations
│       ├── database.go               # DB connection, migrations
│       ├── paths.go                  # Platform-specific paths
│       └── logger.go
│
├── binaries/                         # Embedded MPV binaries
│   ├── mpv-linux
│   ├── mpv.exe
│   └── mpv-darwin
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn components
│   │   │   ├── courses/              # Course components
│   │   │   │   ├── CourseCard.tsx
│   │   │   │   ├── CourseGrid.tsx
│   │   │   │   └── CourseDetail.tsx
│   │   │   ├── player/               # Player components
│   │   │   │   ├── PlayerView.tsx
│   │   │   │   └── PlayerControls.tsx
│   │   │   └── shared/               # Shared components
│   │   │       ├── ImportDialog.tsx
│   │   │       └── SettingsView.tsx
│   │   │
│   │   ├── stores/                   # Zustand stores
│   │   │   ├── courseStore.ts
│   │   │   └── playerStore.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCourses.ts
│   │   │   └── usePlayer.ts
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   │
│   │   └── lib/
│   │       └── utils.ts
│   │
│   ├── wailsjs/                      # Generated Wails bindings
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── build/                            # Build configurations
│   ├── windows/
│   ├── darwin/
│   └── linux/
│
└── README.md
```

---

## 10. Development Guidelines

### 10.1 Code Style

**Go:**
- Follow standard Go conventions (gofmt, golint)
- Use meaningful package names
- Write tests for services
- Document exported functions

**TypeScript:**
- Use functional components with hooks
- Prefer named exports
- Use TypeScript strict mode
- Document complex logic

### 10.2 Git Workflow

- Feature branches: `feature/course-import`, `feature/player`
- Commit messages: Conventional commits format
- PR review before merge to main
- Tag releases: v0.1.0, v0.2.0, etc.

### 10.3 Testing Strategy

**Unit Tests:**
- Database operations
- Scraper service
- Video metadata parsing
- Path utilities

**Integration Tests:**
- Course import flow
- Progress tracking
- MPV communication

**Manual Testing:**
- Cross-platform testing (Linux, Windows, macOS)
- Various course structures
- Edge cases (missing files, corrupted videos)

### 10.4 Error Handling

- Always log errors with context
- Show user-friendly error messages in UI
- Graceful degradation (continue working if non-critical feature fails)
- Retry logic for network operations

### 10.5 Performance Targets

- Library view: Load 1000 courses in < 1 second
- Course detail: Load instantly (< 100ms)
- Video startup: Start playback in < 2 seconds
- Progress save: Non-blocking, < 50ms
- Database queries: < 100ms for common operations

---

## 11. Release Checklist

### 11.1 Pre-Release
- [ ] All MVP features implemented and tested
- [ ] Cross-platform testing completed
- [ ] Performance benchmarks met
- [ ] User documentation written
- [ ] Installation instructions for all platforms
- [ ] Known issues documented
- [ ] Build scripts for all platforms working

### 11.2 Distribution
- [ ] Create GitHub release
- [ ] Upload platform-specific binaries:
  - [ ] Linux (AppImage or .deb)
  - [ ] Windows (.exe installer)
  - [ ] macOS (.dmg or .app bundle)
- [ ] Include MPV binaries in packages
- [ ] Add checksums for downloads
- [ ] Write release notes

### 11.3 Post-Release
- [ ] Monitor user feedback
- [ ] Track bugs and issues
- [ ] Plan post-MVP features
- [ ] Set up community channels (Discord, GitHub Discussions)

---

## 12. Dependencies

### 12.1 Go Dependencies

**Runtime Dependencies:**
```go
require (
    github.com/wailsapp/wails/v2 v2.11.0
    modernc.org/sqlite v1.29.0              // Pure Go SQLite (no CGO)
    github.com/pressly/goose/v3 v3.19.0     // Database migrations
    github.com/PuerkitoBio/goquery v1.9.0   // HTML scraping
    github.com/gosimple/slug v1.14.0        // URL slugs
)
```

**Development Tools** (install separately):
```bash
# sqlc - SQL to Go code generator
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# goose - Migration CLI tool
go install github.com/pressly/goose/v3/cmd/goose@latest
```

> 💡 **Note**: sqlc generates code at build time, so it's not a runtime dependency

### 12.2 Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.0",
    "lucide-react": "^0.468.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  }
}
```

### 12.3 System Requirements

**Minimum:**
- OS: Windows 10+, macOS 11+, Linux (any modern distro)
- RAM: 4GB
- Storage: 100MB for app + course files
- Display: 1280x720

**Recommended:**
- RAM: 8GB+
- Storage: SSD for better video performance
- Display: 1920x1080 or higher

---

## 13. Success Metrics

### 13.1 MVP Success Criteria
- Successfully import and display at least 10 different courses
- Play videos smoothly with progress tracking
- Cross-platform builds working on Linux, Windows, macOS
- No data loss (progress persisted correctly)
- Startup time < 3 seconds
- Single binary distribution (with bundled MPV)

### 13.2 User Experience Goals
- Intuitive first-run setup (< 2 minutes)
- Course import in < 30 seconds (for typical course)
- Smooth 60fps UI animations
- Keyboard navigation fully functional
- Visual design matches Jellyfin aesthetic

---

## 14. Future Considerations

### 14.1 Potential Enhancements
- Mobile companion app (view progress, browse library)
- Cloud sync via WebDAV or custom server
- AI-generated summaries of lectures
- Spaced repetition for course review
- Certificate/achievement tracking
- Course completion certificates (PDF export)
- Social features (share progress with friends)

### 14.2 Monetization (Optional)
- Free open-source version
- Premium features (cloud sync, advanced analytics)
- One-time purchase or subscription
- Donations/sponsorships

### 14.3 Community
- Open source on GitHub
- Accept contributions
- Discord server for support
- Documentation wiki
- Video tutorials

---

## 15. References & Inspiration

### 15.1 Similar Projects
- **Jellyfin**: Media server (UI inspiration)
- **Plex**: Media organization
- **MPV**: Video player
- **Stash**: Media library manager

### 15.2 Technologies
- **Wails**: https://wails.io
- **MPV**: https://mpv.io
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

### 15.3 Resources
- **Wails Documentation**: https://wails.io/docs/introduction
- **MPV IPC Documentation**: https://mpv.io/manual/master/#json-ipc
- **SQLite Documentation**: https://www.sqlite.org/docs.html
- **React Documentation**: https://react.dev

---

## Appendix A: Data Models (TypeScript)

```typescript
// Course
interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  instructorName?: string;
  instructorBio?: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  udemyUrl?: string;
  platform: string;
  coursePath: string;
  totalDuration?: number;
  totalLectures?: number;
  rating?: number;
  enrolledStudents?: number;
  language?: string;
  category?: string;
  subcategory?: string;
  level?: string;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}

// Section
interface Section {
  id: number;
  courseId: number;
  title: string;
  sectionNumber: number;
  description?: string;
  lectures: Lecture[];
}

// Lecture
interface Lecture {
  id: number;
  sectionId: number;
  courseId: number;
  title: string;
  lectureNumber: number;
  filePath: string;
  fileSize?: number;
  duration?: number;
  videoCodec?: string;
  resolution?: string;
  hasSubtitles: boolean;
  subtitlePath?: string;
  progress?: Progress;
}

// Progress
interface Progress {
  id: number;
  lectureId: number;
  courseId: number;
  watchedDuration: number;
  totalDuration?: number;
  lastPosition: number;
  completed: boolean;
  watchCount: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
  updatedAt: string;
}

// Collection
interface Collection {
  id: number;
  name: string;
  description?: string;
  thumbnailPath?: string;
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Settings
interface AppSettings {
  coursesDirectory: string;
  theme: 'dark' | 'light' | 'system';
  defaultPlaybackSpeed: number;
  autoMarkCompleteThreshold: number;
  mpvPath: string;
  firstRun: boolean;
}
```

---

## Appendix B: API Contract (Wails Bindings)

```go
// Course Service
type CourseService struct {}

func (s *CourseService) GetAllCourses() ([]Course, error)
func (s *CourseService) GetCourse(id int) (*CourseDetail, error)
func (s *CourseService) ImportCourse(folderPath string, udemyURL string) error
func (s *CourseService) DeleteCourse(id int) error
func (s *CourseService) ScanCourseFolder(path string) (*CourseStructure, error)

// Player Service
type PlayerService struct {}

func (s *PlayerService) PlayLecture(lectureID int) error
func (s *PlayerService) Pause() error
func (s *PlayerService) Resume() error
func (s *PlayerService) Seek(seconds int) error
func (s *PlayerService) SetVolume(volume int) error
func (s *PlayerService) GetPlaybackState() (*PlaybackState, error)
func (s *PlayerService) Stop() error

// Progress Service
type ProgressService struct {}

func (s *ProgressService) GetCourseProgress(courseID int) (*CourseProgress, error)
func (s *ProgressService) GetLectureProgress(lectureID int) (*Progress, error)
func (s *ProgressService) UpdateProgress(lectureID int, position int) error
func (s *ProgressService) MarkComplete(lectureID int) error

// Settings Service
type SettingsService struct {}

func (s *SettingsService) GetSettings() (*AppSettings, error)
func (s *SettingsService) UpdateSetting(key string, value string) error
func (s *SettingsService) SelectCoursesDirectory() (string, error)
func (s *SettingsService) ValidateCoursesDirectory(path string) error

// Scraper Service
type ScraperService struct {}

func (s *ScraperService) ScrapeUdemyCourse(url string) (*CourseMetadata, error)
func (s *ScraperService) DownloadThumbnail(url string, courseID int) (string, error)
```

---

**End of Specification**

This document will be updated as development progresses and requirements evolve.

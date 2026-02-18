# CourseFin Development Plan

**Project:** CourseFin - Desktop Course Management Application  
**Version Target:** v1.0.0  
**Framework:** Wails v2.11.0 (Go + React + TypeScript)  
**Last Updated:** February 18, 2026

---

## 🚀 Current Progress

**Current Version:** v0.0.0 (In Development)  
**Sprint Status:** Sprint 0 - Foundation (In Progress)

### ✅ Completed (Latest First)

**February 18, 2026 - Web Player Frontend Implementation**
- ✅ Applied CourseFin Modern Tech theme (dark mode default, Blue 600 primary)
- ✅ Added Plyr.js video player dependencies (plyr@3.8.4, plyr-react@5.3.0)
- ✅ Created VideoPlayer component with full Plyr integration
- ✅ Implemented progress tracking (saves every 5 seconds)
- ✅ Added resume position support
- ✅ Created lecture navigation (Next/Previous with keyboard shortcuts)
- ✅ Added subtitle support (WebVTT with automatic SRT conversion)
- ✅ Fixed TypeScript configuration for Wails bindings
- ✅ Verified successful build with `wails build -tags webkit2_41`
- 📦 **Commits:** `fadbefe`, `8cd3b27`, `daeeafa` (pushed to main)

**February 18, 2026 - Web Player Backend Migration**
- ✅ Removed MPV player dependencies and external player approach
- ✅ Created video handler service (internal/player/video_handler.go)
- ✅ Implemented HTTP range request support for video streaming
- ✅ Added SRT to WebVTT subtitle conversion
- ✅ Created player service with business logic (internal/player/service.go)
- ✅ Integrated player with Wails AssetServer
- ✅ Updated app.go to implement http.Handler interface
- ✅ Updated Wails bindings for player methods
- ✅ Updated Go dependencies
- ✅ Updated documentation (COURSEFIN.md, ARCHITECTURE.md)
- 📦 **Commits:** `17c726f`, `e45cdc2`, `91aa7eb`, `b13fc21`, `10dabca`, `f2982ad`

**Sprint 0 - Foundation (Partial)**
- ✅ Project structure initialized
- ✅ Database schema designed and implemented
- ✅ SQLite integration with SQLC
- ✅ Wails v2.11.0 setup
- ✅ React + TypeScript + Vite frontend
- ✅ Tailwind CSS v4 configured
- ✅ pnpm package manager setup
- ⚠️ MPV integration **DEPRECATED** - Migrated to web player

### 🎯 Current Focus

**Next Up: Library View Components (Phase 3)**
- CourseCard component (16:9 poster, progress bar)
- CourseGrid component (responsive layout)
- LibraryView component (main library page)
- EmptyLibrary component (empty state)
- CourseDetail component (sections/lectures)
- LectureList component (collapsible sections)
- Zustand state management setup

### 📋 Architecture Changes

**MPV to Web Player Migration** (February 18, 2026)
- **Reason:** Better integration, simpler cross-platform support, embedded UI
- **Old Approach:** External MPV process with IPC communication
- **New Approach:** Embedded HTML5 player (Plyr.js) with HTTP video streaming
- **Impact:** Simplified architecture, better user experience, no external dependencies

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Definition of Done](#definition-of-done)
3. [Version Roadmap](#version-roadmap)
4. [Sprint 0: Foundation & Setup](#sprint-0-foundation--setup-v000)
5. [Sprint 1: MVP Core](#sprint-1-mvp-core-v010)
6. [Sprint 2: UI Enhancement](#sprint-2-ui-enhancement-v020)
7. [Sprint 3: Player Polish](#sprint-3-player-polish-v030)
8. [Sprint 4: Search & Filtering](#sprint-4-search--filtering-v050)
9. [Sprint 5: Theme System](#sprint-5-theme-system-v050)
10. [Sprint 6: Analytics Dashboard](#sprint-6-analytics-dashboard-v070)
11. [Sprint 7: Playback Features](#sprint-7-playback-features-v070)
12. [Sprint 8: Export & Backup](#sprint-8-export--backup-v090)
13. [Sprint 9: Keyboard Shortcuts](#sprint-9-keyboard-shortcuts-v090)
14. [Sprint 10: Final Polish & Release](#sprint-10-final-polish--release-v100)
15. [Post-v1.0 Roadmap](#post-v10-roadmap)

---

## Project Overview

**CourseFin** is a native desktop application built with Wails that provides a Jellyfin-inspired interface for managing and viewing locally downloaded Udemy courses. The application features:

- 🎯 **Udemy Course Management** with automatic metadata scraping
- 🎬 **Embedded Web Video Player** (Plyr.js) with resume functionality
- 📊 **Progress Tracking & Analytics** for learning insights
- 🎨 **Modern UI** with React + TypeScript + Tailwind CSS + shadcn/ui
- 💾 **Local SQLite Database** for course and progress data
- 🖥️ **Cross-Platform** support (Linux, Windows, macOS)

> **Note:** Originally planned with external MPV player, migrated to embedded web player (Plyr.js) for better integration and user experience.

### Target Users
- Students with downloaded Udemy courses
- Professionals managing technical training libraries
- Self-learners who prefer offline course access

### Tech Stack
- **Backend:** Go 1.23+ with Wails v2.11.0
- **Frontend:** React 18.3+ with TypeScript, Tailwind CSS v4, shadcn/ui
- **Database:** SQLite (pure Go driver)
- **Video Player:** Plyr.js (HTML5 web player, embedded)
- **Package Manager:** pnpm

---

## Definition of Done

For a sprint to be considered complete, all of the following must be satisfied:

### ✅ Functional Requirements
- [ ] All sprint tasks marked as complete
- [ ] Features work on all target platforms (Linux, Windows, macOS)
- [ ] No critical bugs or regressions
- [ ] Code follows STYLE-GUIDE.md conventions
- [ ] Backend uses proper Wails bindings (no fetch/axios)
- [ ] Frontend uses shadcn/ui components (no custom reimplementations)
- [ ] Colors use CSS variables (no hardcoded colors)

### ✅ Testing Requirements
- [ ] Unit tests written for new Go services/functions
- [ ] Integration tests for critical flows (import, playback, etc.)
- [ ] Manual testing completed on primary platform
- [ ] No failing tests in CI pipeline

### ✅ Documentation Requirements
- [ ] README.md updated with new features
- [ ] Go functions have doc comments
- [ ] Complex logic has inline comments
- [ ] CHANGELOG.md updated with version notes

### ✅ Code Quality
- [ ] Code reviewed (self-review minimum)
- [ ] No linter errors (`golangci-lint`, `eslint`)
- [ ] No console errors in development
- [ ] Proper error handling and user feedback

### ✅ User Experience
- [ ] Loading states implemented
- [ ] Error states with retry options
- [ ] Success feedback (toasts/notifications)
- [ ] Keyboard navigation functional
- [ ] Responsive design verified

---

## Version Roadmap

```
v0.0.0 (Sprint 0)  →  Foundation & Setup ✅ (95% Complete)
                       ├─ Project structure ✅
                       ├─ Database setup ✅
                       ├─ Web player backend ✅
                       └─ Web player frontend ✅
                       
v0.1.0 (Sprint 1)  →  MVP Release ⭐ (Next)
                       ├─ Course import with metadata
                       ├─ Basic library grid view
                       ├─ Web player integration ✅ (Early completion)
                       ├─ Progress tracking & resume ✅ (Early completion)
                       └─ Sections/lectures navigation (Partial - navigation buttons done)
                       
v0.2.0 (Sprint 2)  →  UI Enhancement
                       ├─ Jellyfin-style library grid
                       ├─ Course detail view polish
                       └─ Loading/error states
                       
v0.3.0 (Sprint 3)  →  Player Polish (Partially done early)
                       ├─ Enhanced player controls ✅
                       ├─ Next/previous navigation ✅
                       └─ Fullscreen support (Plyr built-in)
                       
v0.5.0 (Sprint 4-5) → Core Features
                       ├─ Search & filtering
                       └─ Dark/light theme system (Partial - dark theme done)
                       
v0.7.0 (Sprint 6-7) → Advanced Features
                       ├─ Analytics dashboard
                       ├─ Playback speed control (Plyr built-in)
                       └─ Subtitle support ✅ (Early completion)
                       
v0.9.0 (Sprint 8-9) → Feature Complete
                       ├─ Export & backup
                       ├─ Keyboard shortcuts (Partial - player shortcuts done)
                       └─ Comprehensive polish
                       
v1.0.0 (Sprint 10) → Release 🚀
                       ├─ Cross-platform testing
                       ├─ Final documentation
                       ├─ Performance optimization
                       └─ Production builds
```

---

## Sprint 0: Foundation & Setup (v0.0.0)

**🎯 Goal:** Set up project infrastructure, development environment, and implement web player backend/frontend.

**📦 Target Version:** v0.0.0 (Development Setup)  
**Status:** 🟢 95% Complete (Player done, awaiting library UI)

### Project Structure

- [x] Initialize Go module and Wails project structure
- [x] Set up frontend directory with React + TypeScript + Vite
- [x] Configure Tailwind CSS v4 with custom theme (CourseFin Modern Tech - dark mode)
- [x] Install and configure shadcn/ui (default style, slate base color)
- [x] Set up pnpm workspace and package.json
- [x] Configure TypeScript with strict mode and path aliases
- [x] Create directory structure per STYLE-GUIDE.md (feature-based)
- [ ] Set up ESLint + Prettier with strict rules
- [x] Configure Git repository with .gitignore

### Database Setup

- [x] Create SQLite database schema (see COURSEFIN.md Section 4)
- [x] Implement database connection and initialization in Go
- [x] Create migration system using Go embeds
- [x] Write initial migration (001_initial_schema.sql)
- [x] Create database models/structs with SQLC
- [x] Implement database service with basic CRUD operations
- [x] Add database indexes for performance
- [ ] Test database operations on all platforms (Linux tested, Windows/macOS pending)

### Web Player Integration

- [x] Implement video HTTP handler with range request support
- [x] Create video streaming service (internal/player/video_handler.go)
- [x] Implement SRT to WebVTT subtitle conversion
- [x] Create player service for business logic (internal/player/service.go)
- [x] Integrate with Wails AssetServer (http.Handler interface)
- [x] Add Plyr.js dependencies to frontend
- [x] Create VideoPlayer component with Plyr integration
- [x] Implement progress tracking (saves every 5 seconds)
- [x] Add resume position support
- [x] Implement lecture navigation (Next/Previous)
- [x] Add keyboard shortcuts (N, P, Space, Arrow keys)
- [x] Support WebVTT subtitles with auto-conversion
- [x] Handle loading and error states
- [x] Test video playback on primary platform

### ~~MPV Integration Research~~ (DEPRECATED - Migrated to Web Player)

- [x] ~~Research MPV binary bundling strategies~~ - Chose web player instead
- [x] ~~Download platform-specific MPV binaries~~ - Not needed
- [x] ~~Implement binary extraction~~ - Not needed
- [x] ~~Create MPV wrapper service~~ - Replaced with HTTP video handler
- [x] ~~Test MPV subprocess launch~~ - Not applicable
- [x] ~~Implement MPV IPC socket connection~~ - Not applicable
- [x] ~~Test basic MPV commands~~ - Not applicable
- [x] ~~Document MPV bundling approach~~ - Documented web player approach instead

### Build & Development Setup

- [x] Create build scripts for all platforms (Linux, Windows, macOS)
- [x] Configure Wails build settings in wails.json (updated for pnpm)
- [x] Set up hot reload for development (`wails dev`)
- [ ] Create Makefile or build scripts for common tasks
- [x] Test build process on primary platform (Linux - webkit2_41)
- [ ] Set up basic CI/CD pipeline (GitHub Actions or similar)
- [ ] Create app icon and branding assets

### Testing

- [ ] Set up Go testing framework and directory structure
- [ ] Write example unit test for database service
- [ ] Write unit tests for player service
- [ ] Set up frontend testing with Vitest (basic config)
- [ ] Verify test commands work (`go test ./...`, `pnpm test`)

### Documentation

- [x] Create README.md with project overview and setup instructions
- [x] Document development workflow (how to run, build, test)
- [ ] Create CHANGELOG.md with v0.0.0 entry
- [ ] Add CONTRIBUTING.md with coding guidelines
- [x] Document web player architecture in ARCHITECTURE.md
- [x] Update COURSEFIN.md with web player design

### Notes & Considerations

- **Web Player Migration:** Successfully migrated from external MPV to embedded Plyr.js web player. Benefits: better integration, simpler cross-platform support, no external dependencies.
- **Database Location:** Ensure proper app data directory paths for each OS (Linux: `~/.local/share/coursefin`, Windows: `AppData/Roaming/coursefin`, macOS: `~/Library/Application Support/coursefin`)
- **Testing:** Focus on getting the test infrastructure working, not comprehensive coverage yet.
- **Platform Testing:** Prioritize primary development platform (Linux), ensure basic functionality on others.

---

## Sprint 1: MVP Core (v0.1.0)

**🎯 Goal:** Deliver a minimally viable product that can import a Udemy course, display it in a library, play videos with the MPV player, and track/resume progress.

**📦 Target Version:** v0.1.0 (MVP Release)

### Backend: Course Import Service

- [ ] Implement folder scanning service (detect sections and lectures)
- [ ] Create video metadata extraction (duration, resolution, codec)
- [ ] Detect subtitle files (.srt, .vtt, .ass) alongside videos
- [ ] Implement Udemy URL parsing and validation
- [ ] Create Udemy web scraper using goquery
- [ ] Extract course metadata (title, instructor, description, thumbnail, etc.)
- [ ] Implement thumbnail download and caching to local storage
- [ ] Create course import flow (folder + URL → database)
- [ ] Handle duplicate courses (check by path or slug)
- [ ] Implement error handling and user-friendly error messages
- [ ] Create Wails binding for `SelectCourseFolder()` method
- [ ] Create Wails binding for `ImportCourse(folderPath, udemyUrl)` method

### Backend: Database Operations

- [ ] Implement course CRUD operations in database service
- [ ] Implement section and lecture CRUD operations
- [ ] Create progress tracking database operations
- [ ] Implement `GetAllCourses()` with progress calculation
- [ ] Implement `GetCourseDetail(courseId)` with sections/lectures
- [ ] Add database transaction support for import operations
- [ ] Create indexes for performance (course slug, lecture paths)

### Backend: MPV Player Service

- [ ] Implement MPV process management (start, stop, restart)
- [ ] Create IPC communication layer (JSON commands over socket)
- [ ] Implement playback controls (play, pause, seek, volume)
- [ ] Implement progress polling (get current position every 5 seconds)
- [ ] Create progress update logic (save to database)
- [ ] Implement resume functionality (start from last position)
- [ ] Implement auto-mark complete logic (90% watched threshold)
- [ ] Create Wails bindings for player controls
- [ ] Handle player errors and crashes gracefully

### Frontend: Settings & First Run

- [ ] Create first-run welcome screen
- [ ] Implement courses directory selection dialog
- [ ] Create settings store with Zustand
- [ ] Implement settings persistence to database
- [ ] Build settings view UI with shadcn/ui components

### Frontend: Course Import UI

- [ ] Create ImportCourseDialog component
- [ ] Implement folder selection UI (using Wails runtime)
- [ ] Add Udemy URL input field with validation
- [ ] Show import progress indicator
- [ ] Display success/error notifications with toasts
- [ ] Handle loading states during import
- [ ] Test import flow end-to-end

### Frontend: Library Grid View

- [ ] Create CourseCard component (16:9 poster, title, instructor, progress bar)
- [ ] Implement course grid layout (auto-fit, responsive)
- [ ] Add hover effects (scale + shadow)
- [ ] Create EmptyLibrary component with CTA
- [ ] Implement LibraryView with header and grid
- [ ] Create course store with Zustand
- [ ] Load courses on app start
- [ ] Handle loading state with skeleton loaders
- [ ] Handle error states with error component

### Frontend: Course Detail View

- [ ] Create CourseDetail component
- [ ] Display course metadata (title, instructor, description, poster)
- [ ] Show sections list with expandable/collapsible accordion
- [ ] Display lectures within each section
- [ ] Show lecture duration and completion status
- [ ] Add "Play" button for each lecture
- [ ] Implement navigation back to library
- [ ] Style with shadcn/ui Card, Accordion components

### Frontend: Player View

- [ ] Create PlayerView component layout
- [ ] Embed MPV window or create placeholder for external player
- [ ] Build PlayerControls component (play/pause, timeline, time display)
- [ ] Implement timeline scrubber with Slider component
- [ ] Add next/previous lecture navigation buttons
- [ ] Show current lecture title and section
- [ ] Implement resume prompt on lecture load
- [ ] Handle player errors with error boundary

### Frontend: Progress Tracking

- [ ] Display progress bar on course cards
- [ ] Show completion percentage on course detail
- [ ] Mark completed lectures with checkmark icon
- [ ] Highlight currently playing lecture
- [ ] Update UI in real-time during playback

### Testing

- [ ] Unit tests for folder scanning logic
- [ ] Unit tests for Udemy scraper (mock HTTP responses)
- [ ] Unit tests for database course operations
- [ ] Integration test for complete import flow
- [ ] Integration test for playback and progress tracking
- [ ] Manual testing of MVP on all platforms
- [ ] Test resume functionality across app restarts

### Documentation

- [ ] Update README.md with MVP feature list
- [ ] Add user guide section (how to import, play courses)
- [ ] Document known limitations of MVP
- [ ] Update CHANGELOG.md with v0.1.0 release notes
- [ ] Add screenshots to README.md

### Notes & Considerations

- **MVP Focus:** Keep features minimal but functional. Prioritize working end-to-end flow over polish.
- **Error Handling:** Graceful degradation is key. If Udemy scraping fails, allow manual metadata entry or skip.
- **Platform Testing:** Test import and playback on all three platforms before release.
- **Performance:** With MVP, focus on functionality. Optimize in later sprints.
- **Udemy Scraping:** May break if Udemy changes their HTML structure. Have fallback strategies ready.

---

## Sprint 2: UI Enhancement (v0.2.0)

**🎯 Goal:** Polish the user interface with Jellyfin-inspired design, improve user experience with better feedback, and refine the library and course detail views.

**📦 Target Version:** v0.2.0

### Library View Enhancements

- [ ] Refine CourseCard styling (poster quality, aspect ratio, shadows)
- [ ] Add "Continue Watching" section at top of library
- [ ] Implement recently added courses section
- [ ] Add course count display in library header
- [ ] Create sort options dropdown (Recently Added, Last Watched, Title A-Z)
- [ ] Improve grid responsiveness (test on various screen sizes)
- [ ] Add smooth scroll animations
- [ ] Polish hover states and transitions
- [ ] Implement "In Progress" and "Completed" badges on cards

### Course Detail View Polish

- [ ] Create hero section with large poster/banner
- [ ] Improve metadata display (rating, students, duration, level)
- [ ] Add course description with "Read More" expand functionality
- [ ] Polish sections accordion with better styling
- [ ] Add lecture count per section
- [ ] Show total course progress prominently
- [ ] Add "Resume Course" button if partially completed
- [ ] Improve spacing and typography throughout

### Loading & Empty States

- [ ] Create comprehensive skeleton loaders for all views
- [ ] Design and implement empty state for "No Courses"
- [ ] Create empty state for "No Lectures" in course detail
- [ ] Add loading spinner for course import
- [ ] Implement progress indicator for metadata scraping
- [ ] Create loading overlay for initial app startup
- [ ] Add shimmer effects to skeleton loaders

### Error Handling & Feedback

- [ ] Create reusable ErrorState component
- [ ] Implement error boundary for React components
- [ ] Add retry functionality to error states
- [ ] Improve toast notifications (success, error, warning styles)
- [ ] Show detailed error messages for import failures
- [ ] Add validation messages for form inputs
- [ ] Implement graceful degradation for missing thumbnails
- [ ] Create fallback placeholder images for courses

### Responsive Design

- [ ] Test library grid on mobile, tablet, desktop sizes
- [ ] Optimize course detail view for smaller screens
- [ ] Ensure dialogs work well on mobile (use Sheet on small screens)
- [ ] Test player controls on various screen sizes
- [ ] Verify all touch targets are accessible (44px minimum)
- [ ] Add mobile-specific navigation patterns if needed

### Accessibility Improvements

- [ ] Add aria-labels to all icon buttons
- [ ] Implement skip-to-content link
- [ ] Ensure all interactive elements have focus indicators
- [ ] Test keyboard navigation through entire app
- [ ] Add proper heading hierarchy (h1, h2, h3)
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Test with screen reader (basic verification)

### Performance Optimization

- [ ] Implement lazy loading for course thumbnails
- [ ] Optimize image sizes (compress thumbnails)
- [ ] Add virtual scrolling if library has 100+ courses
- [ ] Debounce search input (if search partially implemented)
- [ ] Optimize Zustand store selectors to prevent re-renders
- [ ] Profile React components for unnecessary renders

### Testing

- [ ] Visual regression testing (manual comparison)
- [ ] Test responsive breakpoints on all views
- [ ] Test all loading states manually
- [ ] Test error recovery flows
- [ ] Verify accessibility improvements with keyboard-only navigation
- [ ] Test on all platforms for UI consistency

### Documentation

- [ ] Update README.md with new UI features
- [ ] Add screenshots showcasing UI improvements
- [ ] Document accessibility features
- [ ] Update CHANGELOG.md with v0.2.0 notes

### Notes & Considerations

- **Design Consistency:** Refer to STYLE-GUIDE.md for color system, typography, and component usage.
- **Jellyfin Inspiration:** Study Jellyfin's UI for poster layouts, grid spacing, and overall aesthetic.
- **Performance:** Monitor app performance with large libraries (50+ courses). Optimize if needed.
- **User Feedback:** Consider adding basic analytics or logging to understand user behavior (optional).

---

## Sprint 3: Player Polish (v0.3.0)

**🎯 Goal:** Enhance the video player experience with better controls, fullscreen support, and seamless lecture navigation.

**📦 Target Version:** v0.3.0

### Player Controls Enhancement

- [ ] Redesign player controls overlay with better styling
- [ ] Implement volume control slider
- [ ] Add mute/unmute button
- [ ] Create custom timeline scrubber with hover preview
- [ ] Show current time and total duration with proper formatting
- [ ] Add playback indicator (buffering, playing, paused)
- [ ] Implement controls auto-hide after 3 seconds of inactivity
- [ ] Show controls on mouse move
- [ ] Polish controls appearance (gradients, shadows)

### Lecture Navigation

- [ ] Add "Next Lecture" button to player controls
- [ ] Add "Previous Lecture" button to player controls
- [ ] Implement auto-play next lecture on completion (with 5s countdown)
- [ ] Add option to disable auto-play in settings
- [ ] Show next lecture preview on hover
- [ ] Create lecture navigation sidebar (collapsible)
- [ ] Highlight currently playing lecture in sidebar
- [ ] Allow clicking lectures in sidebar to jump to them

### Fullscreen Support

- [ ] Implement fullscreen toggle button
- [ ] Handle fullscreen enter/exit events
- [ ] Adjust controls layout in fullscreen mode
- [ ] Test fullscreen on all platforms (Linux, Windows, macOS)
- [ ] Implement escape key to exit fullscreen
- [ ] Show/hide cursor in fullscreen based on activity

### Progress Tracking Improvements

- [ ] Update progress every 5 seconds during playback
- [ ] Implement "watched threshold" logic (mark as complete at 90%)
- [ ] Show visual indicator when lecture marked complete
- [ ] Update course card progress in real-time after watching
- [ ] Save last watched lecture per course
- [ ] Implement "Continue Watching" quick resume from library

### Player Error Handling

- [ ] Handle missing video files gracefully
- [ ] Show error message if MPV crashes
- [ ] Implement automatic retry for transient MPV errors
- [ ] Add "Report Issue" option in error state
- [ ] Log player errors for debugging
- [ ] Test with corrupted video files

### Keyboard Shortcuts (Player)

- [ ] Implement Space for play/pause
- [ ] Implement Left/Right arrow keys for seek (±10 seconds)
- [ ] Implement Up/Down arrow keys for volume (±5%)
- [ ] Implement F key for fullscreen toggle
- [ ] Implement Escape key for exit fullscreen
- [ ] Implement M key for mute/unmute
- [ ] Add keyboard shortcuts overlay (press ? to show)

### Video Metadata Display

- [ ] Show video resolution during playback (1080p, 720p, etc.)
- [ ] Display video codec information (H.264, H.265, etc.)
- [ ] Show file size in lecture list
- [ ] Add bitrate information if available

### Testing

- [ ] Test player controls on all platforms
- [ ] Test fullscreen mode thoroughly
- [ ] Test lecture navigation (next/previous)
- [ ] Test auto-play next lecture feature
- [ ] Test progress tracking accuracy
- [ ] Test keyboard shortcuts
- [ ] Test with videos of varying lengths and formats
- [ ] Test error scenarios (missing files, corrupted videos)

### Documentation

- [ ] Document keyboard shortcuts in README.md
- [ ] Update user guide with player features
- [ ] Add troubleshooting section for player issues
- [ ] Update CHANGELOG.md with v0.3.0 notes

### Notes & Considerations

- **MPV IPC:** Ensure stable communication with MPV. Handle socket disconnections gracefully.
- **Platform Differences:** Fullscreen behavior may vary by OS. Test thoroughly.
- **User Preferences:** Consider adding player settings (auto-play, auto-hide controls, etc.).
- **Performance:** Monitor CPU usage during playback, especially with 4K videos.

---

## Sprint 4: Search & Filtering (v0.5.0)

**🎯 Goal:** Implement powerful search and filtering capabilities to help users find courses quickly in large libraries.

**📦 Target Version:** v0.5.0 (Part 1)

### Backend: Search Implementation

- [ ] Implement full-text search in SQLite for course titles
- [ ] Add search support for instructor names
- [ ] Add search support for course descriptions
- [ ] Create efficient database queries with indexes
- [ ] Implement fuzzy search or partial matching
- [ ] Add search result ranking/relevance scoring
- [ ] Create Wails binding for `SearchCourses(query)` method
- [ ] Optimize search performance for large datasets (1000+ courses)

### Backend: Filtering Logic

- [ ] Implement filter by course platform (Udemy, future: others)
- [ ] Implement filter by progress status (Not Started, In Progress, Completed)
- [ ] Implement filter by category (extracted from Udemy metadata)
- [ ] Implement filter by level (Beginner, Intermediate, Advanced, All Levels)
- [ ] Implement filter by language
- [ ] Create combined filter query logic (multiple filters at once)
- [ ] Create Wails binding for `FilterCourses(filters)` method

### Backend: Sorting Options

- [ ] Implement sort by date added (newest/oldest)
- [ ] Implement sort by last watched (recently watched first)
- [ ] Implement sort by title (A-Z, Z-A)
- [ ] Implement sort by progress (most/least complete)
- [ ] Implement sort by rating (highest first)
- [ ] Create Wails binding for `SortCourses(sortBy, sortOrder)` method

### Frontend: Search UI

- [ ] Add search bar to library header
- [ ] Implement real-time search with debouncing (300ms delay)
- [ ] Show search results count
- [ ] Add clear search button (X icon)
- [ ] Show "No results found" state with suggestions
- [ ] Highlight search terms in results (optional enhancement)
- [ ] Make search bar accessible on mobile
- [ ] Add search icon with proper styling

### Frontend: Filter UI

- [ ] Create filter dropdown/panel component
- [ ] Add filter by progress status (chips or checkboxes)
- [ ] Add filter by platform (dropdown)
- [ ] Add filter by category (multi-select dropdown)
- [ ] Add filter by level (dropdown)
- [ ] Add filter by language (dropdown)
- [ ] Show active filters as chips/badges
- [ ] Add "Clear All Filters" button
- [ ] Make filter UI responsive (Sheet on mobile)

### Frontend: Sort UI

- [ ] Add sort dropdown to library header
- [ ] Implement sort options (Recently Added, Last Watched, Title A-Z, etc.)
- [ ] Show currently active sort option
- [ ] Add sort direction toggle (ascending/descending)
- [ ] Persist sort preference to local storage or settings

### State Management

- [ ] Update course store to handle search query
- [ ] Add filter state to course store
- [ ] Add sort state to course store
- [ ] Implement combined search + filter + sort logic
- [ ] Optimize store to prevent unnecessary re-renders
- [ ] Add loading state during search/filter operations

### Performance & UX

- [ ] Debounce search input to prevent excessive queries
- [ ] Show loading indicator during search
- [ ] Implement search result caching (optional)
- [ ] Add keyboard shortcuts for search (Ctrl+K or Cmd+K to focus)
- [ ] Preserve search/filter state across navigation
- [ ] Add smooth transitions when filtering/sorting

### Testing

- [ ] Unit tests for search query logic
- [ ] Unit tests for filter combinations
- [ ] Unit tests for sort algorithms
- [ ] Integration test for search + filter + sort together
- [ ] Test with large dataset (100+ courses)
- [ ] Test search performance (should be < 100ms)
- [ ] Manual testing of all filter combinations
- [ ] Test on all platforms

### Documentation

- [ ] Document search syntax (if any special operators)
- [ ] Add filter and sort options to user guide
- [ ] Update README.md with search features
- [ ] Update CHANGELOG.md with v0.5.0 Part 1 notes

### Notes & Considerations

- **SQLite FTS5:** Consider using SQLite's FTS5 extension for better full-text search performance.
- **Filter Persistence:** Decide if filters should persist across app sessions or reset on restart.
- **Mobile UX:** Filter UI might need a drawer/sheet on mobile instead of dropdown.
- **Performance:** With 1000+ courses, ensure search/filter is fast (< 100ms response time).

---

## Sprint 5: Theme System (v0.5.0)

**🎯 Goal:** Implement a complete light/dark theme system with smooth transitions and system theme detection.

**📦 Target Version:** v0.5.0 (Part 2)

### Backend: Theme Settings

- [ ] Add theme preference to app_settings table ('light', 'dark', 'system')
- [ ] Implement settings service for theme CRUD operations
- [ ] Create Wails binding for `GetTheme()` method
- [ ] Create Wails binding for `SetTheme(theme)` method
- [ ] Implement system theme detection on Go side (if needed)

### Frontend: Theme Provider Setup

- [ ] Install theme management library (or use React Context)
- [ ] Create ThemeProvider component wrapping App
- [ ] Implement theme state management with Zustand
- [ ] Add theme toggle to app header or settings
- [ ] Detect system theme preference (`prefers-color-scheme`)
- [ ] Sync theme with backend settings on app start
- [ ] Persist theme selection

### CSS: Light Theme Colors

- [ ] Define light theme color variables in style.css
- [ ] Test all components in light theme
- [ ] Ensure proper contrast ratios (WCAG AA)
- [ ] Adjust shadows for light theme visibility
- [ ] Update border colors for light theme
- [ ] Test course cards in light theme
- [ ] Test player controls in light theme
- [ ] Verify all shadcn/ui components work in light theme

### CSS: Dark Theme Refinement

- [ ] Review existing dark theme colors
- [ ] Adjust for better contrast if needed
- [ ] Ensure soft dark aesthetic (not pure black unless OLED mode)
- [ ] Test dark theme on all views
- [ ] Verify proper shadow visibility in dark theme

### Theme Switcher UI

- [ ] Create theme toggle button (sun/moon icons)
- [ ] Add to app header or settings view
- [ ] Implement smooth theme transition animation
- [ ] Show current theme in settings
- [ ] Add "System" option for auto theme detection
- [ ] Style theme toggle with proper hover/active states

### System Theme Detection

- [ ] Detect OS theme preference on app start
- [ ] Listen for OS theme changes (if user changes system theme)
- [ ] Auto-switch if "System" theme is selected
- [ ] Test on all platforms (Linux, Windows, macOS)

### Component Updates

- [ ] Audit all custom components for hardcoded colors
- [ ] Replace any remaining hardcoded colors with CSS variables
- [ ] Test all shadcn/ui components in both themes
- [ ] Update CourseCard component for theme compatibility
- [ ] Update PlayerControls for theme compatibility
- [ ] Verify toast notifications work in both themes
- [ ] Test dialogs and modals in both themes

### Accessibility

- [ ] Ensure focus indicators are visible in both themes
- [ ] Test contrast ratios in both themes (use contrast checker)
- [ ] Verify text is readable on all backgrounds
- [ ] Test with reduced motion preference
- [ ] Ensure theme toggle is keyboard accessible

### Performance

- [ ] Optimize theme switching (should be instant, < 16ms)
- [ ] Prevent flash of unstyled content (FOUC) on app start
- [ ] Cache theme preference for instant load
- [ ] Test theme switching performance with large library

### Testing

- [ ] Manual testing of light theme on all views
- [ ] Manual testing of dark theme on all views
- [ ] Test system theme detection on all platforms
- [ ] Test theme switching while video is playing
- [ ] Test theme persistence across app restarts
- [ ] Verify no visual glitches during theme transition

### Documentation

- [ ] Document theme options in README.md
- [ ] Add screenshots of both themes
- [ ] Update user guide with theme switching instructions
- [ ] Update CHANGELOG.md with v0.5.0 theme features

### Notes & Considerations

- **CSS Variables:** All theming relies on CSS variables defined in style.css. Never hardcode colors.
- **Smooth Transitions:** Add `transition` property to theme-dependent elements for smooth switching.
- **OLED Option:** Consider adding pure black theme option for OLED displays in future.
- **User Preference:** Most users prefer dark theme for video applications. Dark should be default.

---

## Sprint 6: Analytics Dashboard (v0.7.0)

**🎯 Goal:** Build a comprehensive analytics dashboard showing learning statistics, watch time, completion rates, and learning streaks.

**📦 Target Version:** v0.7.0 (Part 1)

### Backend: Analytics Data Collection

- [ ] Add analytics tables to database (watch_sessions, daily_stats)
- [ ] Track watch sessions (start time, end time, duration, course_id, lecture_id)
- [ ] Calculate daily watch time aggregates
- [ ] Implement learning streak calculation logic
- [ ] Track course completion dates
- [ ] Create database queries for analytics data
- [ ] Optimize analytics queries with proper indexes

### Backend: Analytics Service

- [ ] Create AnalyticsService with data aggregation methods
- [ ] Implement `GetWatchTimeStats(period)` - daily, weekly, monthly
- [ ] Implement `GetCourseCompletionRate()` - overall completion percentage
- [ ] Implement `GetLearningStreak()` - current streak and best streak
- [ ] Implement `GetMostWatchedCourses(limit)` - top courses by watch time
- [ ] Implement `GetRecentActivity(days)` - recent watch history
- [ ] Create Wails bindings for all analytics methods

### Frontend: Analytics Page/View

- [ ] Create AnalyticsView component
- [ ] Design analytics dashboard layout (cards/sections)
- [ ] Add navigation to analytics from main menu or settings
- [ ] Create responsive layout for analytics dashboard
- [ ] Implement loading states for analytics data

### Watch Time Statistics

- [ ] Create WatchTimeCard component showing total hours watched
- [ ] Implement daily watch time chart (bar chart or line chart)
- [ ] Add weekly watch time visualization
- [ ] Add monthly watch time visualization
- [ ] Show average daily watch time
- [ ] Add time period selector (7 days, 30 days, all time)

### Completion Statistics

- [ ] Display overall completion rate (courses completed / total courses)
- [ ] Show total courses completed count
- [ ] Show courses in progress count
- [ ] Show total lectures completed
- [ ] Create completion rate progress bar/gauge
- [ ] Add breakdown by course status (not started, in progress, completed)

### Learning Streak Tracker

- [ ] Create LearningStreakCard showing current streak
- [ ] Display longest streak record
- [ ] Show calendar heatmap of watch activity (GitHub-style)
- [ ] Add visual indicators for streak milestones
- [ ] Implement streak calculation logic (consecutive days with >5min watch time)

### Course Statistics

- [ ] Display "Most Watched Courses" list (top 5-10)
- [ ] Show watch time per course
- [ ] Display course completion percentages
- [ ] Add visual charts (pie chart or bar chart) for course distribution
- [ ] Show average completion time per course

### Recent Activity

- [ ] Create recent activity timeline/feed
- [ ] Show recently watched lectures
- [ ] Display recent course completions
- [ ] Add timestamps (e.g., "2 hours ago", "Yesterday")
- [ ] Limit to last 7-30 days of activity

### Data Visualization

- [ ] Install chart library (recharts, visx, or chart.js)
- [ ] Create reusable chart components (BarChart, LineChart, PieChart)
- [ ] Implement responsive charts
- [ ] Style charts to match app theme (light/dark)
- [ ] Add tooltips to charts for detailed info
- [ ] Implement smooth animations for chart rendering

### Testing

- [ ] Unit tests for analytics calculation logic
- [ ] Unit tests for streak calculation
- [ ] Integration tests for analytics queries
- [ ] Test with various date ranges
- [ ] Test with empty data (no watch history)
- [ ] Test performance with large datasets (1+ year of data)
- [ ] Manual testing of all visualizations

### Documentation

- [ ] Document analytics metrics and calculations
- [ ] Add analytics section to user guide
- [ ] Update README.md with analytics features
- [ ] Update CHANGELOG.md with v0.7.0 Part 1 notes

### Notes & Considerations

- **Privacy:** All analytics data stays local (SQLite database). No external tracking.
- **Performance:** Analytics queries should be fast (< 200ms). Use proper indexes.
- **Data Accuracy:** Ensure watch time is accurately tracked even if app crashes.
- **Chart Library:** Choose a library that works well with React and supports theming.
- **Streak Logic:** Define what counts as "active day" (e.g., watched >5 minutes).

---

## Sprint 7: Playback Features (v0.7.0)

**🎯 Goal:** Add advanced playback features including speed control and comprehensive subtitle support.

**📦 Target Version:** v0.7.0 (Part 2)

### Backend: Playback Speed Control

- [ ] Implement MPV command for setting playback speed
- [ ] Add playback speed to player state tracking
- [ ] Persist playback speed preference to settings
- [ ] Create Wails binding for `SetPlaybackSpeed(speed)` method
- [ ] Create Wails binding for `GetPlaybackSpeed()` method

### Backend: Subtitle Support

- [ ] Implement subtitle file detection during course import
- [ ] Store subtitle file paths in lectures table
- [ ] Implement MPV command to load subtitle file
- [ ] Implement MPV command to toggle subtitles on/off
- [ ] Implement MPV command to adjust subtitle delay
- [ ] Support multiple subtitle tracks if available
- [ ] Create Wails binding for `LoadSubtitles(lecturePath, subtitlePath)` method
- [ ] Create Wails binding for `ToggleSubtitles()` method
- [ ] Create Wails binding for `SetSubtitleDelay(delayMs)` method

### Frontend: Playback Speed UI

- [ ] Add playback speed button to player controls
- [ ] Create playback speed dropdown/popover
- [ ] Add preset speed options (0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x)
- [ ] Add custom speed input (advanced option)
- [ ] Highlight current speed in UI
- [ ] Show speed indicator on player (e.g., "1.5x" badge)
- [ ] Persist speed preference per user (not per course)

### Frontend: Subtitle UI

- [ ] Add subtitle toggle button to player controls
- [ ] Show subtitle indicator when subtitles available
- [ ] Create subtitles settings popover/dialog
- [ ] Add subtitle track selector (if multiple tracks)
- [ ] Add subtitle delay adjustment slider (+/- 5 seconds)
- [ ] Show subtitle status (on/off) in player
- [ ] Display subtitle file name/language if available
- [ ] Style subtitle controls consistently with other player controls

### Subtitle File Support

- [ ] Test with .srt subtitle files
- [ ] Test with .vtt subtitle files
- [ ] Test with .ass subtitle files (styled subtitles)
- [ ] Handle missing subtitle files gracefully
- [ ] Show warning if subtitle file missing but expected
- [ ] Test subtitle sync with video playback

### Keyboard Shortcuts

- [ ] Add keyboard shortcut for speed increase (] or >)
- [ ] Add keyboard shortcut for speed decrease ([ or <)
- [ ] Add keyboard shortcut for reset speed to 1x (=)
- [ ] Add keyboard shortcut for toggle subtitles (C or S)
- [ ] Add keyboard shortcut for subtitle delay (+ and -)
- [ ] Update keyboard shortcuts overlay with new shortcuts

### Player Settings

- [ ] Add playback settings section to app settings
- [ ] Allow setting default playback speed
- [ ] Allow setting default subtitle state (on/off)
- [ ] Add option to remember last used speed
- [ ] Add option to auto-load subtitles if available

### Testing

- [ ] Test playback speed at all preset values
- [ ] Test custom playback speeds (edge cases)
- [ ] Test speed changes during playback (should be smooth)
- [ ] Test subtitle loading for all supported formats
- [ ] Test subtitle toggling on/off
- [ ] Test subtitle delay adjustment
- [ ] Test with videos lacking subtitles
- [ ] Test keyboard shortcuts for playback features
- [ ] Test on all platforms

### Documentation

- [ ] Document playback speed feature in user guide
- [ ] Document subtitle support and formats
- [ ] Add keyboard shortcuts to documentation
- [ ] Update README.md with new playback features
- [ ] Update CHANGELOG.md with v0.7.0 Part 2 notes

### Notes & Considerations

- **Speed Limits:** MPV supports 0.25x to 4x speed. Limit UI to 0.5x-2x for user sanity.
- **Subtitle Formats:** MPV natively supports SRT, VTT, ASS. No additional parsing needed.
- **Subtitle Encoding:** Handle different text encodings (UTF-8, Latin-1, etc.) gracefully.
- **Performance:** Playback speed shouldn't affect performance. Test with 4K videos.
- **User Preference:** Some users always watch at 1.5x or 2x. Make it easy to set default.

---

## Sprint 8: Export & Backup (v0.9.0)

**🎯 Goal:** Implement data export and backup functionality to allow users to backup their progress and course data.

**📦 Target Version:** v0.9.0 (Part 1)

### Backend: Export Service

- [ ] Create ExportService for data serialization
- [ ] Implement `ExportCourseData(courseId)` - export single course metadata
- [ ] Implement `ExportAllCourses()` - export all courses as JSON
- [ ] Implement `ExportProgress(courseId)` - export progress for one course
- [ ] Implement `ExportAllProgress()` - export all progress data as JSON
- [ ] Implement `ExportWatchHistory()` - export watch history/sessions
- [ ] Implement `ExportFullBackup()` - export everything (courses, progress, settings)
- [ ] Create Wails bindings for all export methods

### Backend: Import/Restore Service

- [ ] Create ImportService for data deserialization
- [ ] Implement `ImportCourseData(jsonData)` - restore course metadata
- [ ] Implement `ImportProgress(jsonData)` - restore progress data
- [ ] Implement `RestoreFromBackup(backupFile)` - full restore
- [ ] Handle data conflicts (e.g., duplicate courses)
- [ ] Validate imported data for integrity
- [ ] Create Wails bindings for import/restore methods

### File Format Design

- [ ] Design JSON schema for course export
- [ ] Design JSON schema for progress export
- [ ] Design JSON schema for full backup
- [ ] Include version number in export files for compatibility
- [ ] Add timestamp and app version to exports
- [ ] Ensure human-readable JSON format

### Frontend: Export UI

- [ ] Create Export/Backup view in settings
- [ ] Add "Export Course Data" button
- [ ] Add "Export Progress" button
- [ ] Add "Export Watch History" button
- [ ] Add "Create Full Backup" button
- [ ] Implement file save dialog using Wails runtime
- [ ] Show export progress indicator
- [ ] Show success notification with file location
- [ ] Handle export errors gracefully

### Frontend: Import/Restore UI

- [ ] Add "Import Course Data" button
- [ ] Add "Restore Progress" button
- [ ] Add "Restore from Backup" button
- [ ] Implement file open dialog using Wails runtime
- [ ] Show import progress indicator
- [ ] Show preview of data before importing (optional)
- [ ] Confirm before overwriting existing data
- [ ] Show success notification with import summary

### Backup Automation (Optional)

- [ ] Add auto-backup setting (daily, weekly, never)
- [ ] Implement scheduled backup logic
- [ ] Store backups in app data directory
- [ ] Add backup retention policy (keep last N backups)
- [ ] Show list of existing backups in UI
- [ ] Allow restoring from specific backup date

### Export Options

- [ ] Add option to export with/without thumbnails
- [ ] Add option to export course file paths or not
- [ ] Add option to anonymize data (remove personal paths)
- [ ] Add compression option for large exports (zip)

### Testing

- [ ] Unit tests for export JSON generation
- [ ] Unit tests for import JSON parsing
- [ ] Integration test for export → import round-trip
- [ ] Test with various data sizes (small, medium, large libraries)
- [ ] Test import validation and error handling
- [ ] Test backup restoration
- [ ] Test on all platforms
- [ ] Verify data integrity after import

### Documentation

- [ ] Document export file format (JSON schema)
- [ ] Add backup/restore guide to user documentation
- [ ] Document best practices for backups
- [ ] Add troubleshooting section for import errors
- [ ] Update README.md with export features
- [ ] Update CHANGELOG.md with v0.9.0 Part 1 notes

### Notes & Considerations

- **File Location:** Use native file dialogs for good UX. Default to Documents folder.
- **Data Privacy:** Exported JSON may contain file paths. Warn users about sharing exports.
- **Compatibility:** Version exported data for future compatibility as app evolves.
- **Compression:** For large libraries (100+ courses), consider zipping exports.
- **Cloud Sync:** Export/import enables manual "cloud sync" via Dropbox, Google Drive, etc.

---

## Sprint 9: Keyboard Shortcuts (v0.9.0)

**🎯 Goal:** Implement comprehensive keyboard navigation and shortcuts throughout the application for power users.

**📦 Target Version:** v0.9.0 (Part 2)

### Keyboard Shortcuts System

- [ ] Create keyboard shortcut manager/registry
- [ ] Implement global keyboard event listener
- [ ] Handle keyboard shortcuts in different contexts (library, player, settings)
- [ ] Prevent conflicts with browser/OS shortcuts
- [ ] Support different shortcuts per platform (Cmd on macOS, Ctrl on Windows/Linux)
- [ ] Create reusable hook: `useKeyboardShortcut(key, handler)`

### Library View Shortcuts

- [ ] `Ctrl/Cmd + K` - Focus search bar
- [ ] `Ctrl/Cmd + N` - Open "Add Course" dialog
- [ ] `Arrow Keys` - Navigate course grid
- [ ] `Enter` - Open selected course
- [ ] `Ctrl/Cmd + F` - Toggle filters
- [ ] `/` - Focus search (alternative)
- [ ] `Escape` - Clear search / Close dialogs

### Player Shortcuts (Expand from Sprint 3)

- [ ] `Space` - Play/pause (already implemented)
- [ ] `Left/Right Arrow` - Seek ±10 seconds (already implemented)
- [ ] `J/L` - Seek ±10 seconds (alternative)
- [ ] `Up/Down Arrow` - Volume ±5% (already implemented)
- [ ] `M` - Mute/unmute (already implemented)
- [ ] `F` - Toggle fullscreen (already implemented)
- [ ] `Escape` - Exit fullscreen (already implemented)
- [ ] `N` - Next lecture
- [ ] `P` - Previous lecture
- [ ] `[` - Decrease playback speed
- [ ] `]` - Increase playback speed
- [ ] `=` - Reset playback speed to 1x
- [ ] `C` or `S` - Toggle subtitles
- [ ] `,` - Previous frame (fine seek)
- [ ] `.` - Next frame (fine seek)
- [ ] `0-9` - Seek to percentage (0=0%, 5=50%, 9=90%)

### Global Shortcuts

- [ ] `Ctrl/Cmd + ,` - Open settings
- [ ] `Ctrl/Cmd + Q` - Quit application (with confirmation)
- [ ] `Ctrl/Cmd + R` - Refresh/reload (with confirmation)
- [ ] `Ctrl/Cmd + T` - Toggle theme (light/dark)
- [ ] `Ctrl/Cmd + H` - Go to home/library
- [ ] `Ctrl/Cmd + /` or `?` - Show keyboard shortcuts help

### Keyboard Shortcuts Help Dialog

- [ ] Create KeyboardShortcutsDialog component
- [ ] List all shortcuts organized by category
- [ ] Show platform-specific shortcuts (Cmd vs Ctrl)
- [ ] Add search/filter for shortcuts
- [ ] Make dialog accessible and printable
- [ ] Add link to shortcuts help in settings or menu

### Navigation Shortcuts

- [ ] `Ctrl/Cmd + 1` - Navigate to Library
- [ ] `Ctrl/Cmd + 2` - Navigate to Analytics (if visible in nav)
- [ ] `Ctrl/Cmd + 3` - Navigate to Settings
- [ ] `Alt + Left Arrow` - Go back (browser-like)
- [ ] `Alt + Right Arrow` - Go forward (browser-like)
- [ ] `Tab` - Navigate between interactive elements

### Accessibility Enhancements

- [ ] Ensure all interactive elements are keyboard accessible
- [ ] Add visible focus indicators throughout app
- [ ] Implement focus trapping in dialogs/modals
- [ ] Add skip navigation links
- [ ] Test full app navigation with keyboard only (no mouse)
- [ ] Ensure screen reader compatibility with shortcuts

### Customization (Optional)

- [ ] Add keyboard shortcuts settings page
- [ ] Allow users to customize shortcuts
- [ ] Show current key bindings in settings
- [ ] Validate for conflicts when customizing
- [ ] Store custom shortcuts in settings database

### Visual Feedback

- [ ] Show keyboard shortcut hints on hover (tooltips)
- [ ] Add keyboard shortcut badges to buttons (e.g., "⌘N" badge)
- [ ] Show active shortcut visually (e.g., button press effect)
- [ ] Add on-screen keyboard shortcuts overlay (optional)

### Testing

- [ ] Test all keyboard shortcuts on all platforms
- [ ] Test shortcut conflicts (ensure no duplicates)
- [ ] Test with different keyboard layouts (QWERTY, AZERTY, etc.)
- [ ] Test keyboard navigation through entire app
- [ ] Verify focus indicators are visible
- [ ] Test with screen reader (basic verification)
- [ ] Test on all three platforms (macOS Cmd vs. others Ctrl)

### Documentation

- [ ] Create comprehensive keyboard shortcuts documentation
- [ ] Add shortcuts to user guide
- [ ] Create printable keyboard shortcuts cheat sheet (PDF)
- [ ] Update README.md with keyboard navigation info
- [ ] Update CHANGELOG.md with v0.9.0 Part 2 notes

### Notes & Considerations

- **Platform Differences:** Use `Cmd` on macOS, `Ctrl` on Windows/Linux. Detect platform in code.
- **Context Awareness:** Some shortcuts only work in specific contexts (e.g., player shortcuts).
- **Discoverability:** Make shortcuts discoverable via tooltips and help dialog.
- **Power Users:** Keyboard shortcuts are for power users. Don't remove mouse functionality.
- **Conflicts:** Avoid conflicts with browser shortcuts (Ctrl+T, Ctrl+W, etc.).

---

## Sprint 10: Final Polish & Release (v1.0.0)

**🎯 Goal:** Finalize the application for v1.0.0 release with comprehensive testing, documentation, performance optimization, and production builds.

**📦 Target Version:** v1.0.0 🚀

### Cross-Platform Testing

- [ ] Full regression testing on Linux (primary platform)
- [ ] Full regression testing on Windows
- [ ] Full regression testing on macOS
- [ ] Test all features on each platform
- [ ] Verify keyboard shortcuts work on each platform
- [ ] Test file dialogs on each platform
- [ ] Test MPV integration on each platform
- [ ] Verify UI consistency across platforms
- [ ] Test with different screen resolutions and DPI settings
- [ ] Test on different OS versions (Ubuntu 22.04+, Windows 10/11, macOS 12+)

### Bug Fixes & Polish

- [ ] Fix all known critical bugs
- [ ] Fix all known high-priority bugs
- [ ] Address medium-priority bugs (prioritize by impact)
- [ ] Polish UI animations and transitions
- [ ] Fix any layout issues or visual glitches
- [ ] Improve error messages for clarity
- [ ] Enhance loading states where needed
- [ ] Fix any accessibility issues found during testing

### Performance Optimization

- [ ] Profile application startup time (target: <3 seconds)
- [ ] Optimize database queries (target: <100ms for common operations)
- [ ] Optimize React rendering (eliminate unnecessary re-renders)
- [ ] Optimize image loading (lazy loading, compression)
- [ ] Test with large library (100+ courses, 1000+ lectures)
- [ ] Optimize MPV integration (reduce IPC overhead)
- [ ] Reduce application bundle size if possible
- [ ] Test memory usage during long sessions

### Security & Stability

- [ ] Audit for security vulnerabilities (dependency check)
- [ ] Ensure proper input validation everywhere
- [ ] Handle edge cases gracefully (empty states, missing files, etc.)
- [ ] Test application stability (no crashes during normal use)
- [ ] Test error recovery (app should recover from errors gracefully)
- [ ] Ensure database integrity (test corrupted database scenarios)

### Documentation Completion

- [ ] Complete user guide with all features documented
- [ ] Add troubleshooting section to README.md
- [ ] Document system requirements clearly
- [ ] Create FAQ section for common questions
- [ ] Add contributing guidelines (CONTRIBUTING.md)
- [ ] Document development setup in detail
- [ ] Add screenshots and GIFs to README.md showcasing all features
- [ ] Create video demo or tutorial (optional but recommended)
- [ ] Write release notes for v1.0.0
- [ ] Update all documentation links and references

### Build & Distribution

- [ ] Create production build for Linux (AppImage or .deb)
- [ ] Create production build for Windows (.exe installer or portable)
- [ ] Create production build for macOS (.dmg or .app bundle)
- [ ] Sign binaries (code signing for macOS/Windows if possible)
- [ ] Test installation on clean systems (each platform)
- [ ] Verify MPV binaries are correctly bundled
- [ ] Test uninstallation process
- [ ] Create checksums for all release binaries (SHA256)
- [ ] Set up GitHub releases or distribution method

### Release Preparation

- [ ] Finalize CHANGELOG.md with full v1.0.0 notes
- [ ] Tag v1.0.0 in Git repository
- [ ] Create GitHub release with binaries
- [ ] Write release announcement (blog post, GitHub, etc.)
- [ ] Prepare social media announcements (if applicable)
- [ ] Create demo video or screenshots for promotion
- [ ] Set up issue tracker and community channels (GitHub Issues, Discord, etc.)

### Final Testing Checklist

- [ ] Fresh install on Linux → Import course → Play video → Verify progress
- [ ] Fresh install on Windows → Import course → Play video → Verify progress
- [ ] Fresh install on macOS → Import course → Play video → Verify progress
- [ ] Test upgrade from v0.9.0 to v1.0.0 (database migration)
- [ ] Test with no internet connection (should work fully offline)
- [ ] Test with corrupted course folder (should handle gracefully)
- [ ] Test with missing MPV binary (should show error and recover)
- [ ] Test backup and restore functionality end-to-end
- [ ] Test export and import on different machines

### Post-Release Tasks

- [ ] Monitor user feedback and bug reports
- [ ] Create issue templates for bug reports and feature requests
- [ ] Set up basic analytics or telemetry (opt-in, privacy-respecting)
- [ ] Plan v1.1.0 features based on feedback
- [ ] Update website or landing page with v1.0.0 info
- [ ] Celebrate the release! 🎉

### Documentation

- [ ] Final review of all documentation
- [ ] Proofread README.md, user guide, and all docs
- [ ] Ensure all links work
- [ ] Add license information (MIT, GPL, etc.)
- [ ] Add credits and acknowledgments
- [ ] Update screenshots to reflect final v1.0.0 UI

### Notes & Considerations

- **Quality over Speed:** Don't rush v1.0.0. It's better to delay than release with critical bugs.
- **First Impressions Matter:** v1.0.0 is the first stable release. Make it polished and reliable.
- **Community:** Engage with early users for feedback. Be responsive to bug reports.
- **Backup Plan:** Have a rollback plan if critical bugs are found post-release.
- **Communication:** Be clear about known limitations and future plans.

---

## Post-v1.0 Roadmap

### v1.1.0 - Collections & Organization

**Potential Features:**
- [ ] Collections/Playlists for organizing courses
- [ ] Tags and custom categories
- [ ] Advanced filtering by tags
- [ ] Course recommendations based on watch history

### v1.2.0 - Note-Taking

**Potential Features:**
- [ ] Timestamped notes during video playback
- [ ] Rich text editor for notes
- [ ] Notes search and organization
- [ ] Export notes to Markdown

### v1.3.0 - Social Features (Optional)

**Potential Features:**
- [ ] Share progress with friends (opt-in)
- [ ] Course completion badges/achievements
- [ ] Learning goals and reminders
- [ ] Study streak notifications

### v2.0.0 - Multi-Platform Support

**Potential Features:**
- [ ] Support for Coursera courses
- [ ] Support for Pluralsight courses
- [ ] Support for YouTube playlists
- [ ] Universal course manager

### Future Considerations

- Mobile companion app (view library, sync progress)
- Cloud sync via WebDAV or custom server
- AI-generated course summaries
- Spaced repetition system for review
- Course completion certificates (PDF export)
- Community-driven features based on feedback

---

## Sprint Dependencies & Risk Management

### Critical Dependencies

1. **MPV Bundling** (Sprint 0) - Blocks Sprint 1
   - **Risk:** High complexity, platform-specific
   - **Mitigation:** Thorough research, fallback to local MPV if needed

2. **Database Schema** (Sprint 0) - Blocks all sprints
   - **Risk:** Schema changes later are costly
   - **Mitigation:** Design comprehensive schema upfront, use migrations

3. **Udemy Scraping** (Sprint 1) - Core functionality
   - **Risk:** May break if Udemy changes HTML structure
   - **Mitigation:** Fallback to manual metadata entry, graceful degradation

4. **Wails Bindings** (All sprints) - Core architecture
   - **Risk:** Incorrect bindings can cause runtime errors
   - **Mitigation:** Test bindings thoroughly, use TypeScript types

### Sprint Blockers

- Sprint 1 requires Sprint 0 completion (foundation)
- Sprint 3 requires Sprint 1 (player exists)
- Sprint 6 requires Sprint 1 (progress tracking exists)
- Sprint 8 requires all data structures finalized

### Risk Mitigation Strategies

1. **Technical Risks:**
   - Test on all platforms early and often
   - Have fallback strategies for external dependencies (Udemy scraping)
   - Use established libraries and frameworks (avoid custom solutions)

2. **Scope Risks:**
   - Prioritize ruthlessly (MVP first, features later)
   - Be willing to cut features to meet quality bar
   - Use flexible sprint durations (don't force deadlines)

3. **Quality Risks:**
   - Write tests as you go (don't defer to end)
   - Review code regularly (self-review minimum)
   - Test on all platforms before declaring sprint complete

---

## Notes for Development

### General Guidelines

- **Follow COURSEFIN.md** for technical architecture and specifications
- **Follow STYLE-GUIDE.md** for frontend code style and patterns
- **Use pnpm** for all frontend package management (never npm or yarn)
- **Use shadcn CLI** to install UI components (never copy/paste)
- **Never hardcode colors** - always use CSS variables
- **Use Wails bindings** for backend communication (never fetch/axios)
- **Test on all platforms** before marking sprint complete

### Code Quality Standards

- **Go:** Follow standard Go conventions (gofmt, golint)
- **TypeScript:** Use strict mode, proper types, no `any`
- **React:** Functional components with hooks, no class components
- **Testing:** Write tests as you build, don't defer to end
- **Documentation:** Update docs in same PR as code changes

### Git Workflow

- Use feature branches: `feature/sprint-1-import`, `feature/sprint-2-ui`
- Commit message format: `[Sprint X] Feature: description`
- Tag releases: `v0.1.0`, `v0.2.0`, etc.
- Update CHANGELOG.md with each sprint

### When to Move to Next Sprint

A sprint is complete when:
1. All checkboxes are marked complete
2. Tests pass on all platforms
3. Documentation is updated
4. Definition of Done is satisfied
5. No critical bugs or regressions

Don't rush! Quality over speed.

---

**End of Development Plan**

**Ready to build CourseFin v1.0.0!** 🚀

---

*Last Updated: February 18, 2026*  
*Document Version: 1.0.0*

# CourseFin Backend Architecture

**Version:** 1.0.0
**Last Updated:** February 18, 2026
**Status:** Implementation Guide

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architectural Principles](#2-architectural-principles)
3. [Technology Stack](#3-technology-stack)
4. [Directory Structure](#4-directory-structure)
5. [Layer Responsibilities](#5-layer-responsibilities)
6. [Database Layer (sqlc + goose)](#6-database-layer-sqlc--goose)
7. [Dependency Injection](#7-dependency-injection)
8. [Error Handling](#8-error-handling)
9. [Testing Strategy](#9-testing-strategy)
10. [Code Examples](#10-code-examples)
11. [Best Practices](#11-best-practices)

---

## 1. Overview

CourseFin follows a **Pragmatic Clean Architecture** approach, balancing:
- **Maintainability**: Clear separation of concerns
- **Testability**: Easy to mock and test each layer
- **Simplicity**: Avoiding over-engineering and excessive abstraction
- **Type Safety**: Leveraging Go's type system and sqlc code generation

### Key Design Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Database Layer** | sqlc + goose | Type-safe SQL with explicit migration control |
| **Architecture Style** | Pragmatic Clean Architecture | Balance between purity and pragmatism |
| **Project Structure** | Feature-based modules | Easier navigation, cohesive features |
| **Repository Pattern** | Interfaces with sqlc Querier | Testability and flexibility |
| **Dependency Injection** | Manual constructors | Explicit, simple, no magic |
| **Error Handling** | Domain-specific errors | Better error context and handling |

---

## 2. Architectural Principles

### 2.1 Dependency Rule

**Dependencies point inward**: Outer layers depend on inner layers, never the reverse.

```
┌─────────────────────────────────────────────┐
│  Wails Frontend (React/TypeScript)          │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  app.go (Wails Bindings / Handlers)         │  ◄── Orchestrates services
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Services (Business Logic)                   │  ◄── Domain operations
│  course/, player/, progress/                 │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Repositories (Data Access)                  │  ◄── DB operations via sqlc
│  Implements domain interfaces                │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  sqlc (Generated Queries)                    │  ◄── Type-safe SQL
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  SQLite Database                             │
└─────────────────────────────────────────────┘
```

### 2.2 Core Principles

1. **Domain Independence**: Core business logic doesn't depend on frameworks or databases
2. **Interface Segregation**: Small, focused interfaces (Repository, Querier)
3. **Dependency Inversion**: High-level modules depend on abstractions (interfaces)
4. **Single Responsibility**: Each layer has one clear purpose
5. **Explicit over Implicit**: Clear dependencies, no hidden magic

### 2.3 What This Architecture Provides

✅ **Testability**: Mock repositories and services easily
✅ **Flexibility**: Swap implementations without changing business logic
✅ **Type Safety**: Compile-time errors for SQL queries (sqlc)
✅ **Maintainability**: Clear structure, easy to navigate
✅ **Performance**: No ORM overhead, raw SQL performance

---

## 3. Technology Stack

### 3.1 Core Dependencies

```go
require (
    github.com/wailsapp/wails/v2 v2.11.0          // Desktop app framework
    modernc.org/sqlite v1.29.0                     // Pure Go SQLite (no CGO)
    github.com/pressly/goose/v3 v3.19.0            // Database migrations
    // sqlc generates code, no runtime dependency
)
```

### 3.2 Development Tools

```bash
# Install sqlc (SQL to Go code generator)
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Install goose (migration tool)
go install github.com/pressly/goose/v3/cmd/goose@latest

# Install golangci-lint (linting)
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

### 3.3 Why These Choices?

| Tool | Why We Use It |
|------|---------------|
| **sqlc** | Generates type-safe Go code from SQL. No runtime overhead, full SQL power, compile-time safety. |
| **goose** | Simple migration tool with up/down migrations. Works with embedded filesystems. |
| **modernc.org/sqlite** | Pure Go SQLite driver (no CGO). Easier cross-compilation for Windows/macOS/Linux. |
| **No ORM** | ORMs add complexity and performance overhead. SQL is explicit and fast. |

---

## 4. Directory Structure

### 4.1 Complete Project Layout

```
coursefin/
├── main.go                           # Entry point, dependency wiring
├── app.go                            # Wails App struct, exposed methods
├── wails.json                        # Wails configuration
├── sqlc.yaml                         # sqlc configuration
├── go.mod
├── go.sum
│
├── migrations/                       # goose database migrations
│   ├── 001_initial_schema.up.sql
│   ├── 001_initial_schema.down.sql
│   ├── 002_add_indexes.up.sql
│   └── 002_add_indexes.down.sql
│
├── queries/                          # SQL queries for sqlc
│   ├── courses.sql                   # Course-related queries
│   ├── sections.sql                  # Section queries
│   ├── lectures.sql                  # Lecture queries
│   ├── progress.sql                  # Progress tracking queries
│   └── settings.sql                  # App settings queries
│
├── internal/                         # Private application code
│   │
│   ├── domain/                       # Core entities & interfaces
│   │   ├── course.go                 # Course, Section, Lecture entities
│   │   ├── progress.go               # Progress entity
│   │   ├── settings.go               # Settings entity
│   │   ├── collection.go             # Collection entity
│   │   ├── errors.go                 # Domain errors (ErrNotFound, etc.)
│   │   └── repository.go             # Repository interfaces
│   │
│   ├── course/                       # Course feature module
│   │   ├── repository.go             # CourseRepository implementation
│   │   ├── service.go                # CourseService (business logic)
│   │   ├── scanner.go                # Folder scanning logic
│   │   └── dto.go                    # Data Transfer Objects for Wails
│   │
│   ├── player/                       # Video player feature
│   │   ├── service.go                # PlayerService (video URL generation)
│   │   ├── video_handler.go          # Video serving with range requests
│   │   ├── progress.go               # Progress tracking integration
│   │   └── dto.go                    # Player DTOs
│   │
│   ├── progress/                     # Progress tracking feature
│   │   ├── repository.go             # ProgressRepository
│   │   ├── service.go                # ProgressService
│   │   └── dto.go                    # Progress DTOs
│   │
│   ├── scraper/                      # Udemy metadata scraper
│   │   ├── service.go                # ScraperService
│   │   └── udemy.go                  # Udemy-specific scraping logic
│   │
│   ├── settings/                     # App settings feature
│   │   ├── repository.go             # SettingsRepository
│   │   ├── service.go                # SettingsService
│   │   └── dto.go                    # Settings DTOs
│   │
│   ├── sqlc/                         # Generated sqlc code
│   │   ├── db.go                     # DBTX interface (generated)
│   │   ├── models.go                 # Generated models
│   │   ├── querier.go                # Querier interface (generated)
│   │   ├── courses.sql.go            # Generated course queries
│   │   ├── lectures.sql.go           # Generated lecture queries
│   │   ├── progress.sql.go           # Generated progress queries
│   │   └── settings.sql.go           # Generated settings queries
│   │
│   └── infrastructure/               # External integrations
│       ├── database.go               # Database connection & goose runner
│       ├── paths.go                  # Platform-specific paths
│       └── logger.go                 # Logging utilities
│
└── frontend/                         # React frontend (see STYLE-GUIDE.md)
    └── ...
```

### 4.2 Feature Module Structure

Each feature module follows this pattern:

```
internal/<feature>/
├── repository.go     # Data access (implements domain.XRepository)
├── service.go        # Business logic (orchestrates operations)
├── dto.go            # Data Transfer Objects (for Wails/frontend)
└── <helpers>.go      # Feature-specific utilities
```

**Example: `internal/course/`**
- `repository.go` - Implements `domain.CourseRepository` using sqlc
- `service.go` - Course import, scanning, metadata management
- `scanner.go` - Folder scanning and video file detection
- `dto.go` - DTOs to send to frontend

---

## 5. Layer Responsibilities

### 5.1 Domain Layer (`internal/domain/`)

**Purpose**: Define core business entities and interfaces

**Responsibilities**:
- Define domain entities (Course, Lecture, Progress)
- Define repository interfaces (CourseRepository, ProgressRepository)
- Define domain errors (ErrNotFound, ErrAlreadyExists)
- No external dependencies (pure Go structs and interfaces)

**Example**:
```go
// internal/domain/course.go
package domain

import "time"

type Course struct {
    ID              int64
    Title           string
    Slug            string
    Description     string
    InstructorName  string
    ThumbnailPath   string
    CoursePath      string
    TotalDuration   int
    TotalLectures   int
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

type Section struct {
    ID            int64
    CourseID      int64
    Title         string
    SectionNumber int
    Lectures      []Lecture
}

type Lecture struct {
    ID            int64
    SectionID     int64
    CourseID      int64
    Title         string
    LectureNumber int
    FilePath      string
    Duration      int
    Resolution    string
}
```

### 5.2 Service Layer (`internal/*/service.go`)

**Purpose**: Business logic and orchestration

**Design Decision**: CourseFin services use `sqlc.Querier` directly — no separate `repository.go` layer.
This is a deliberate pragmatic choice: sqlc already generates type-safe, testable query functions, so wrapping
them in another repository layer adds boilerplate with no real benefit for a single-database desktop app.

**Responsibilities**:
- Hold a `sqlc.Querier` interface field (not the concrete `*sqlc.Queries` — use the interface for testability)
- Implement business rules and validation
- Orchestrate multi-step DB operations (e.g., import course → create sections → create lectures)
- Return domain entities or DTOs to the Wails app layer

**Pattern**:
```go
// internal/course/service.go
package course

import (
    "context"
    "coursefin/internal/sqlc"
)

type Service struct {
    queries sqlc.Querier  // ← Interface, not *sqlc.Queries (enables mocking/testing)
}

func NewService(queries sqlc.Querier) *Service {
    return &Service{queries: queries}
}

func (s *Service) ImportCourse(ctx context.Context, folderPath, coursesDir string) (*ImportCourseResult, error) {
    // 1. Scan filesystem
    metadata, err := ScanCourseFolder(folderPath, coursesDir)
    if err != nil {
        return nil, err
    }

    // 2. Check if already exists → smart sync
    existing, err := s.queries.GetCourseByPath(ctx, folderPath)
    if err == nil && existing != nil {
        return s.syncExistingCourse(ctx, existing, metadata, ...)
    }

    // 3. Fresh import → create course, sections, lectures
    course, err := s.queries.CreateCourse(ctx, sqlc.CreateCourseParams{...})
    // ...
    return &ImportCourseResult{...}, nil
}
```

**Why no `repository.go`?**

| Concern | How it's handled |
|---------|------------------|
| **Testability** | `sqlc.Querier` is an interface — swap with a mock in tests |
| **Type safety** | sqlc generates compile-time safe query functions directly |
| **Abstraction** | No need: single SQLite database, no plans to swap storage |
| **Transactions** | Handled in service methods directly via context |


### 5.3 Infrastructure Layer (`internal/infrastructure/`)

**Purpose**: External dependencies and platform-specific code

**Responsibilities**:
- Database connection management
- Migration runner
- Platform-specific paths (app data directory)
- Logging setup

### 5.4 Wails App Layer (`app.go`)

**Purpose**: Expose methods to frontend via Wails bindings

**Responsibilities**:
- Call service methods
- Convert domain entities to DTOs (if needed)
- Handle Wails-specific concerns (context, runtime)
- Error formatting for frontend

**Pattern**:
```go
// app.go
package main

import (
    "context"
    "coursefin/internal/course"
    "coursefin/internal/player"
    "coursefin/internal/progress"
)

type App struct {
    ctx             context.Context
    courseService   *course.Service
    playerService   *player.Service
    progressService *progress.Service
}

// Wails lifecycle hook
func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
}

// Exposed to frontend
func (a *App) GetAllCourses() ([]course.CourseDTO, error) {
    courses, err := a.courseService.GetAll(a.ctx)
    if err != nil {
        return nil, err
    }
    return course.ToCourseDTOs(courses), nil
}

func (a *App) ImportCourse(folderPath, udemyURL string) error {
    _, err := a.courseService.ImportCourse(a.ctx, folderPath, udemyURL)
    return err
}
```

---

## 6. Database Layer (sqlc + goose)

### 6.1 sqlc Configuration

Create `sqlc.yaml` in project root:

```yaml
version: "2"
sql:
  - engine: "sqlite"
    queries: "./queries"
    schema: "./migrations"
    gen:
      go:
        package: "sqlc"
        out: "./internal/sqlc"
        sql_package: "database/sql"
        emit_json_tags: true
        emit_interface: true          # ← Generate Querier interface
        emit_empty_slices: true
        emit_pointers_for_null_types: true
```

**Key settings**:
- `emit_interface: true` - Generates `Querier` interface for mocking
- `emit_json_tags: true` - Adds JSON tags to structs
- `emit_pointers_for_null_types: true` - Uses `*string` for nullable fields

### 6.2 Writing SQL Queries

Place queries in `queries/*.sql` files:

**Example: `queries/courses.sql`**
```sql
-- name: GetCourse :one
SELECT * FROM courses WHERE id = ? LIMIT 1;

-- name: ListCourses :many
SELECT * FROM courses ORDER BY created_at DESC;

-- name: CreateCourse :one
INSERT INTO courses (
    title, slug, description, instructor_name, course_path, created_at, updated_at
) VALUES (
    ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
RETURNING *;

-- name: UpdateCourse :exec
UPDATE courses
SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: DeleteCourse :exec
DELETE FROM courses WHERE id = ?;

-- name: GetCourseWithSections :many
SELECT
    c.*,
    s.id as section_id,
    s.title as section_title,
    s.section_number
FROM courses c
LEFT JOIN sections s ON s.course_id = c.id
WHERE c.id = ?
ORDER BY s.section_number;
```

**sqlc Annotations**:
- `:one` - Returns single row
- `:many` - Returns slice of rows
- `:exec` - Returns only error (INSERT/UPDATE/DELETE)
- `:execrows` - Returns rows affected count
- `:execresult` - Returns sql.Result

### 6.3 Generating Code

Run sqlc to generate Go code:

```bash
sqlc generate
```

**Generated files** (in `internal/sqlc/`):
- `db.go` - DBTX interface
- `models.go` - Structs for tables
- `querier.go` - **Querier interface** (all query methods)
- `courses.sql.go` - Implementation of course queries
- `*.sql.go` - Implementation for each query file

### 6.4 The Querier Interface Pattern

**Generated by sqlc** (`internal/sqlc/querier.go`):
```go
package sqlc

import "context"

type Querier interface {
    GetCourse(ctx context.Context, id int64) (Course, error)
    ListCourses(ctx context.Context) ([]Course, error)
    CreateCourse(ctx context.Context, arg CreateCourseParams) (Course, error)
    UpdateCourse(ctx context.Context, arg UpdateCourseParams) error
    DeleteCourse(ctx context.Context, id int64) error
    // ... all other query methods
}
```

**Why use Querier interface?**

✅ **Testability**: Mock the entire database layer
✅ **Transactions**: Pass `*sql.Tx` or `*sql.DB` (both implement Querier)
✅ **Flexibility**: Swap implementations without changing repository code
✅ **Interface Segregation**: Define custom interfaces with subset of methods

### 6.5 Database Migrations (goose)

**Migration structure**:
```
migrations/
├── 001_initial_schema.up.sql     # Apply migration
├── 001_initial_schema.down.sql   # Rollback migration
├── 002_add_indexes.up.sql
└── 002_add_indexes.down.sql
```

**Example: `migrations/001_initial_schema.up.sql`**
```sql
-- +goose Up
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    instructor_name TEXT,
    course_path TEXT NOT NULL,
    total_duration INTEGER,
    total_lectures INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    section_number INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(course_id, section_number)
);

-- +goose Down
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS courses;
```

**Running migrations programmatically**:
```go
// internal/infrastructure/database.go
package infrastructure

import (
    "database/sql"
    "embed"

    "github.com/pressly/goose/v3"
    _ "modernc.org/sqlite"
)

//go:embed ../migrations/*.sql
var embedMigrations embed.FS

func RunMigrations(db *sql.DB) error {
    goose.SetBaseFS(embedMigrations)

    if err := goose.SetDialect("sqlite3"); err != nil {
        return err
    }

    if err := goose.Up(db, "migrations"); err != nil {
        return err
    }

    return nil
}
```

**Manual migration commands**:
```bash
# Apply all migrations
goose -dir migrations sqlite3 ./coursefin.db up

# Rollback one migration
goose -dir migrations sqlite3 ./coursefin.db down

# Check status
goose -dir migrations sqlite3 ./coursefin.db status

# Create new migration
goose -dir migrations create add_collections sql
```

---

## 7. Dependency Injection

### 7.1 Manual DI in main.go

Services are wired explicitly in `main.go` / `startup()`. Each service receives a `sqlc.Querier` directly:

```go
// main.go
queries := sqlc.New(db)  // *sqlc.Queries implements sqlc.Querier

// Services get the Querier interface directly (no repository wrapper)
courseSvc  := course.NewService(queries)
settingsSvc := settings.NewService(queries)
playerSvc  := player.NewService(db, coursesDir, videoServer)

app := &App{
    courseSvc:   courseSvc,
    settingsSvc: settingsSvc,
    playerSvc:   playerSvc,
}
```

### 7.1 Manual DI in main.go

**Explicit dependency wiring**:

```go
// main.go
package main

import (
    "context"
    "database/sql"
    "log"

    "coursefin/internal/course"
    "coursefin/internal/infrastructure"
    "coursefin/internal/player"
    "coursefin/internal/progress"
    "coursefin/internal/scraper"
    "coursefin/internal/settings"
    "coursefin/internal/sqlc"

    "github.com/wailsapp/wails/v2"
    "github.com/wailsapp/wails/v2/pkg/options"
)

func main() {
    // 1. Initialize database
    db, err := infrastructure.NewDatabase()
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // 2. Run migrations
    if err := infrastructure.RunMigrations(db); err != nil {
        log.Fatal(err)
    }

    // 3. Create sqlc Queries (implements Querier interface)
    queries := sqlc.New(db)

    // 4. Initialize repositories
    courseRepo := course.NewRepository(queries)
    progressRepo := progress.NewRepository(queries)
    settingsRepo := settings.NewRepository(queries)

    // 5. Initialize services
    scraperSvc := scraper.NewService()
    courseSvc := course.NewService(courseRepo, scraperSvc)
    progressSvc := progress.NewService(progressRepo)
    playerSvc := player.NewService(progressSvc)
    settingsSvc := settings.NewService(settingsRepo)

    // 6. Create Wails app
    app := &App{
        db:              db,
        courseService:   courseSvc,
        playerService:   playerSvc,
        progressService: progressSvc,
        settingsService: settingsSvc,
    }

    // 7. Run Wails
    if err := wails.Run(&options.App{
        Title:     "CourseFin",
        Width:     1280,
        Height:    720,
        OnStartup: app.startup,
        Bind: []interface{}{
            app,
        },
    }); err != nil {
        log.Fatal(err)
    }
}
```

### 9.2 App Struct

```go
// app.go
package main

import (
    "context"
    "database/sql"

    "coursefin/internal/course"
    "coursefin/internal/player"
    "coursefin/internal/progress"
    "coursefin/internal/settings"
)

type App struct {
    ctx             context.Context
    db              *sql.DB
    courseService   *course.Service
    playerService   *player.Service
    progressService *progress.Service
    settingsService *settings.Service
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
}
```

### 9.3 Constructor Pattern

**All components use constructor functions**:

```go
// ✅ Good: Constructor with explicit dependencies
func NewService(repo domain.CourseRepository, scraper *scraper.Service) *Service {
    return &Service{
        repo:    repo,
        scraper: scraper,
    }
}

// ❌ Bad: No constructor, direct instantiation
svc := &Service{}
```

---

## 10. Error Handling

### 10.1 Domain Errors

**Define in `internal/domain/errors.go`**:

```go
package domain

import (
    "errors"
    "fmt"
)

// Domain errors
var (
    ErrNotFound       = errors.New("resource not found")
    ErrAlreadyExists  = errors.New("resource already exists")
    ErrInvalidInput   = errors.New("invalid input")
    ErrInvalidPath    = errors.New("invalid file path")
    ErrDatabase       = errors.New("database error")
    ErrExternal       = errors.New("external service error")
)

// Custom error with context
type CourseError struct {
    Op      string  // Operation (e.g., "ImportCourse")
    CourseID int64
    Err     error
}

func (e *CourseError) Error() string {
    return fmt.Sprintf("course error [op=%s, id=%d]: %v", e.Op, e.CourseID, e.Err)
}

func (e *CourseError) Unwrap() error {
    return e.Err
}
```

### 10.2 Error Wrapping

**In repositories**:
```go
func (r *Repository) GetByID(ctx context.Context, id int64) (*domain.Course, error) {
    row, err := r.querier.GetCourse(ctx, id)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, domain.ErrNotFound
        }
        return nil, fmt.Errorf("get course by id: %w", err)
    }
    return toDomainCourse(row), nil
}
```

**In services**:
```go
func (s *Service) ImportCourse(ctx context.Context, folderPath, udemyURL string) (*domain.Course, error) {
    course, err := s.createCourse(folderPath, udemyURL)
    if err != nil {
        return nil, fmt.Errorf("import course: %w", err)
    }

    if err := s.repo.Create(ctx, course); err != nil {
        return nil, fmt.Errorf("save course to database: %w", err)
    }

    return course, nil
}
```

**In app.go (for frontend)**:
```go
func (a *App) ImportCourse(folderPath, udemyURL string) error {
    _, err := a.courseService.ImportCourse(a.ctx, folderPath, udemyURL)
    if err != nil {
        // Log error
        log.Printf("import course failed: %v", err)

        // Return user-friendly message
        if errors.Is(err, domain.ErrAlreadyExists) {
            return fmt.Errorf("course already imported")
        }
        if errors.Is(err, domain.ErrInvalidPath) {
            return fmt.Errorf("invalid course folder path")
        }
        return fmt.Errorf("failed to import course: %v", err)
    }
    return nil
}
```

### 10.3 Error Checking

```go
// Use errors.Is for sentinel errors
if errors.Is(err, domain.ErrNotFound) {
    // Handle not found
}

// Use errors.As for custom error types
var courseErr *domain.CourseError
if errors.As(err, &courseErr) {
    log.Printf("Course error: op=%s, id=%d", courseErr.Op, courseErr.CourseID)
}
```

---

## 11. Testing Strategy

### 11.1 Repository Testing (with sqlc)

**Mock the Querier interface**:

```go
// internal/course/repository_test.go
package course_test

import (
    "context"
    "testing"

    "coursefin/internal/course"
    "coursefin/internal/domain"
    "coursefin/internal/sqlc"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

// Mock Querier
type MockQuerier struct {
    mock.Mock
}

func (m *MockQuerier) GetCourse(ctx context.Context, id int64) (sqlc.Course, error) {
    args := m.Called(ctx, id)
    return args.Get(0).(sqlc.Course), args.Error(1)
}

// Test
func TestRepository_GetByID(t *testing.T) {
    mockQuerier := new(MockQuerier)
    repo := course.NewRepository(mockQuerier)

    expectedRow := sqlc.Course{
        ID:    1,
        Title: "Test Course",
        Slug:  "test-course",
    }

    mockQuerier.On("GetCourse", mock.Anything, int64(1)).Return(expectedRow, nil)

    result, err := repo.GetByID(context.Background(), 1)

    assert.NoError(t, err)
    assert.Equal(t, "Test Course", result.Title)
    mockQuerier.AssertExpectations(t)
}
```

### 11.2 Service Testing

**Mock the repository interface**:

```go
// internal/course/service_test.go
package course_test

import (
    "context"
    "testing"

    "coursefin/internal/course"
    "coursefin/internal/domain"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

// Mock CourseRepository
type MockCourseRepository struct {
    mock.Mock
}

func (m *MockCourseRepository) GetByID(ctx context.Context, id int64) (*domain.Course, error) {
    args := m.Called(ctx, id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*domain.Course), args.Error(1)
}

func (m *MockCourseRepository) Create(ctx context.Context, course *domain.Course) error {
    args := m.Called(ctx, course)
    return args.Error(0)
}

// Test
func TestService_GetByID(t *testing.T) {
    mockRepo := new(MockCourseRepository)
    mockScraper := new(MockScraperService)

    svc := course.NewService(mockRepo, mockScraper)

    expectedCourse := &domain.Course{
        ID:    1,
        Title: "Test Course",
    }

    mockRepo.On("GetByID", mock.Anything, int64(1)).Return(expectedCourse, nil)

    result, err := svc.GetByID(context.Background(), 1)

    assert.NoError(t, err)
    assert.Equal(t, "Test Course", result.Title)
    mockRepo.AssertExpectations(t)
}
```

### 11.3 Integration Tests

**Test with real SQLite database**:

```go
func TestIntegration_CourseRepository(t *testing.T) {
    // Setup in-memory database
    db, err := sql.Open("sqlite", ":memory:")
    require.NoError(t, err)
    defer db.Close()

    // Run migrations
    err = infrastructure.RunMigrations(db)
    require.NoError(t, err)

    // Create repository with real queries
    queries := sqlc.New(db)
    repo := course.NewRepository(queries)

    // Test Create
    course := &domain.Course{
        Title:      "Integration Test Course",
        Slug:       "integration-test",
        CoursePath: "/tmp/course",
    }

    err = repo.Create(context.Background(), course)
    require.NoError(t, err)
    assert.NotZero(t, course.ID)

    // Test GetByID
    result, err := repo.GetByID(context.Background(), course.ID)
    require.NoError(t, err)
    assert.Equal(t, "Integration Test Course", result.Title)
}
```

---

## 12. Code Examples

### 12.1 Complete Feature: Progress Tracking

**Domain entity** (`internal/domain/progress.go`):
```go
package domain

import "time"

type Progress struct {
    ID              int64
    LectureID       int64
    CourseID        int64
    WatchedDuration int
    TotalDuration   int
    LastPosition    int
    Completed       bool
    WatchCount      int
    LastWatchedAt   time.Time
    UpdatedAt       time.Time
}
```

**SQL queries** (`queries/progress.sql`):
```sql
-- name: GetProgressByLectureID :one
SELECT * FROM progress WHERE lecture_id = ? LIMIT 1;

-- name: UpsertProgress :exec
INSERT INTO progress (lecture_id, course_id, last_position, watched_duration, total_duration, completed, last_watched_at)
VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
ON CONFLICT(lecture_id) DO UPDATE SET
    last_position = excluded.last_position,
    watched_duration = MAX(watched_duration, excluded.watched_duration),
    completed = excluded.completed,
    watch_count = watch_count + 1,
    last_watched_at = CURRENT_TIMESTAMP;

-- name: MarkLectureComplete :exec
UPDATE progress
SET completed = 1, last_watched_at = CURRENT_TIMESTAMP
WHERE lecture_id = ?;
```

**Repository** (`internal/progress/repository.go`):
```go
package progress

import (
    "context"
    "coursefin/internal/domain"
    "coursefin/internal/sqlc"
)

type Repository struct {
    querier sqlc.Querier
}

func NewRepository(querier sqlc.Querier) *Repository {
    return &Repository{querier: querier}
}

func (r *Repository) GetByLectureID(ctx context.Context, lectureID int64) (*domain.Progress, error) {
    row, err := r.querier.GetProgressByLectureID(ctx, lectureID)
    if err != nil {
        return nil, err
    }
    return toDomainProgress(row), nil
}

func (r *Repository) Upsert(ctx context.Context, progress *domain.Progress) error {
    return r.querier.UpsertProgress(ctx, sqlc.UpsertProgressParams{
        LectureID:       progress.LectureID,
        CourseID:        progress.CourseID,
        LastPosition:    int64(progress.LastPosition),
        WatchedDuration: int64(progress.WatchedDuration),
        TotalDuration:   int64(progress.TotalDuration),
        Completed:       progress.Completed,
    })
}
```

**Service** (`internal/progress/service.go`):
```go
package progress

import (
    "context"
    "coursefin/internal/domain"
)

type Service struct {
    repo domain.ProgressRepository
}

func NewService(repo domain.ProgressRepository) *Service {
    return &Service{repo: repo}
}

func (s *Service) UpdateProgress(ctx context.Context, lectureID, courseID, position, duration int) error {
    completed := float64(position)/float64(duration) > 0.9

    progress := &domain.Progress{
        LectureID:       int64(lectureID),
        CourseID:        int64(courseID),
        LastPosition:    position,
        WatchedDuration: position,
        TotalDuration:   duration,
        Completed:       completed,
    }

    return s.repo.Upsert(ctx, progress)
}
```

**Exposed to frontend** (`app.go`):
```go
func (a *App) UpdateProgress(lectureID, courseID, position, duration int) error {
    return a.progressService.UpdateProgress(a.ctx, lectureID, courseID, position, duration)
}
```

---

## 13. Best Practices

### 13.1 General Guidelines

1. **Keep layers independent**: Don't let infrastructure concerns leak into domain
2. **Use interfaces for dependencies**: Makes testing easier
3. **Explicit error handling**: Always check and wrap errors with context
4. **Immutable DTOs**: Use separate DTOs for frontend communication
5. **Transaction management**: Handle at service layer, not repository
6. **Context propagation**: Pass `context.Context` through all layers

### 13.2 Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| Use sqlc Querier interface in repositories | Pass `*sql.DB` directly to repositories |
| Define repository interfaces in domain package | Define interfaces in implementation packages |
| Map sqlc models to domain entities | Expose sqlc models to services or frontend |
| Handle nullable SQL types explicitly | Ignore NULL handling |
| Use constructors for all structs | Use struct literals with uninitialized fields |
| Write tests for business logic | Skip testing "simple" code |
| Use transactions for multi-step operations | Make multiple separate DB calls |
| Validate inputs in services | Assume inputs are valid |

### 13.3 Code Organization Checklist

- [ ] Domain entities defined in `internal/domain/`
- [ ] Repository interfaces in `internal/domain/repository.go`
- [ ] Repository implementations use `sqlc.Querier` interface
- [ ] Services depend on repository interfaces, not implementations
- [ ] SQL queries in `queries/*.sql` files
- [ ] Migrations in `migrations/*.sql` files
- [ ] DTOs defined per feature (e.g., `internal/course/dto.go`)
- [ ] All dependencies injected via constructors
- [ ] Errors wrapped with context at each layer
- [ ] Tests written for repositories and services

---

## 14. Migration from Existing Code

If you have existing code without this architecture:

### Step 1: Define Domain Entities
Move data structures to `internal/domain/`

### Step 2: Set Up sqlc
1. Write SQL queries in `queries/*.sql`
2. Configure `sqlc.yaml`
3. Run `sqlc generate`

### Step 3: Create Repository Interfaces
Define interfaces in `internal/domain/repository.go`

### Step 4: Implement Repositories
Implement interfaces using sqlc Querier

### Step 5: Extract Business Logic to Services
Move logic from app.go to service layer

### Step 6: Wire Dependencies
Update main.go with manual DI

### Step 7: Update Tests
Write unit tests with mocks

---

## 15. References

### Tools
- **sqlc**: https://sqlc.dev
- **goose**: https://github.com/pressly/goose
- **modernc.org/sqlite**: https://gitlab.com/cznic/sqlite

### Architecture Resources
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **Go Project Layout**: https://github.com/golang-standards/project-layout
- **sqlc Tutorial**: https://docs.sqlc.dev/en/latest/tutorials/getting-started-sqlite.html

### Testing
- **testify**: https://github.com/stretchr/testify
- **Go Testing**: https://go.dev/doc/tutorial/add-a-test

---

**End of Architecture Document**

This architecture provides a solid foundation for building maintainable, testable, and performant Go backend code for CourseFin.

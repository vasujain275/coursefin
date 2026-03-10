// ============================================================================
// Package database - SQLite Database Connection and Management
// ============================================================================
// Purpose: Central database connection management for CourseFin
// Features:
//   - SQLite connection pooling
//   - Automatic migrations using goose
//   - Type-safe queries via sqlc
//   - Transaction support
//   - Graceful shutdown
// ============================================================================

package database

import (
	"database/sql"
	"embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/pressly/goose/v3"
	_ "modernc.org/sqlite" // Pure Go SQLite driver (no CGO required)

	"coursefin/internal/sqlc"
)

//go:embed migrations
var embedMigrations embed.FS

// DB wraps the database connection and provides access to queries
type DB struct {
	conn    *sql.DB
	queries *sqlc.Queries
	dbPath  string
}

// NewDB creates a new database connection and runs migrations
// dataDir: Application data directory where coursefin.db will be stored
func NewDB(dataDir string) (*DB, error) {
	// Log the data directory we're trying to create
	fmt.Printf("Creating data directory: %s\n", dataDir)

	// Ensure data directory exists
	// Use 0777 for cross-platform compatibility (OS will apply umask)
	if err := os.MkdirAll(dataDir, 0777); err != nil {
		return nil, fmt.Errorf("failed to create data directory '%s': %w", dataDir, err)
	}

	// Verify directory was created successfully
	if info, err := os.Stat(dataDir); err != nil {
		return nil, fmt.Errorf("data directory '%s' not accessible after creation: %w", dataDir, err)
	} else if !info.IsDir() {
		return nil, fmt.Errorf("data directory path '%s' exists but is not a directory", dataDir)
	}

	fmt.Printf("Data directory confirmed: %s\n", dataDir)

	dbPath := filepath.Join(dataDir, "coursefin.db")

	// Open SQLite connection with recommended settings
	// - Busy timeout: 5s (handle concurrent writes)
	// - Journal mode: WAL (Write-Ahead Logging for better concurrency)
	// - Synchronous: NORMAL (good balance of safety and performance)
	// - Foreign keys: ON (enforce referential integrity)
	// - Cache size: 10MB (speed up queries)
	// Note: modernc.org/sqlite uses driver name "sqlite" (not "sqlite3")
	conn, err := sql.Open("sqlite", fmt.Sprintf("%s?_busy_timeout=5000&_journal_mode=WAL&_synchronous=NORMAL&_foreign_keys=ON&cache=shared", dbPath))
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	conn.SetMaxOpenConns(1) // SQLite works best with single writer
	conn.SetMaxIdleConns(1)

	// Apply additional performance pragmas via db.Exec
	pragmas := map[string]string{
		"journal_mode": "WAL",       // Write-Ahead Logging for better concurrency
		"synchronous":  "NORMAL",    // Balance safety and performance
		"cache_size":   "-32000",    // 32MB cache (negative = KB)
		"temp_store":   "MEMORY",    // In-memory temporary storage
		"mmap_size":    "134217728", // 128MB memory-mapped I/O
		"foreign_keys": "ON",        // Enforce referential integrity
	}

	for pragma, value := range pragmas {
		pragmaSQL := fmt.Sprintf("PRAGMA %s=%s;", pragma, value)
		if _, err := conn.Exec(pragmaSQL); err != nil {
			conn.Close()
			return nil, fmt.Errorf("failed to set PRAGMA %s=%s: %w", pragma, value, err)
		}
	}

	// Test connection
	if err := conn.Ping(); err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	db := &DB{
		conn:    conn,
		queries: sqlc.New(conn),
		dbPath:  dbPath,
	}

	// Run migrations
	if err := db.runMigrations(); err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	// Quick integrity check — log warning on corruption, don't block startup
	var result string
	if err := conn.QueryRow("PRAGMA quick_check").Scan(&result); err != nil {
		fmt.Printf("WARNING: database integrity check failed: %v\n", err)
	} else if result != "ok" {
		fmt.Printf("WARNING: database corruption detected: %s\n", result)
	}

	return db, nil
}

// runMigrations applies all pending database migrations using goose
func (db *DB) runMigrations() error {
	// Set goose to use embedded filesystem
	goose.SetBaseFS(embedMigrations)

	// Configure goose for SQLite
	// Note: Even though we use "sqlite" driver, goose dialect is "sqlite3"
	if err := goose.SetDialect("sqlite3"); err != nil {
		return fmt.Errorf("failed to set goose dialect: %w", err)
	}

	// Run migrations from embedded filesystem
	if err := goose.Up(db.conn, "migrations"); err != nil {
		return fmt.Errorf("goose up failed: %w", err)
	}

	return nil
}

// Close closes the database connection gracefully
func (db *DB) Close() error {
	if db.conn != nil {
		return db.conn.Close()
	}
	return nil
}

// Queries returns the sqlc-generated query interface
// Use this to access type-safe database queries
func (db *DB) Queries() *sqlc.Queries {
	return db.queries
}

// Conn returns the raw database connection
// Use this for transactions or custom queries
func (db *DB) Conn() *sql.DB {
	return db.conn
}

// DBPath returns the absolute path to the database file
func (db *DB) DBPath() string {
	return db.dbPath
}

// BeginTx starts a new transaction
// Remember to defer tx.Rollback() and call tx.Commit() on success
func (db *DB) BeginTx() (*sql.Tx, error) {
	return db.conn.Begin()
}

// WithTx executes a function within a transaction
// Automatically commits on success, rolls back on error
func (db *DB) WithTx(fn func(*sqlc.Queries) error) error {
	tx, err := db.conn.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Create queries scoped to this transaction
	queries := db.queries.WithTx(tx)

	// Execute function
	if err := fn(queries); err != nil {
		tx.Rollback()
		return err
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetAppDataDir returns the platform-specific application data directory
// - Linux: ~/.local/share/coursefin
// - macOS: ~/Library/Application Support/coursefin
// - Windows: %APPDATA%\coursefin
func GetAppDataDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %w", err)
	}

	var dataDir string
	switch {
	case fileExists("/proc/version"): // Linux
		dataDir = filepath.Join(homeDir, ".local", "share", "coursefin")
	case fileExists("/System/Library/CoreServices/SystemVersion.plist"): // macOS
		dataDir = filepath.Join(homeDir, "Library", "Application Support", "coursefin")
	default: // Windows
		appData := os.Getenv("APPDATA")
		if appData != "" {
			dataDir = filepath.Join(appData, "coursefin")
		} else {
			// Fallback if APPDATA is not set
			dataDir = filepath.Join(homeDir, "AppData", "Roaming", "coursefin")
		}
		fmt.Printf("Windows detected - APPDATA: %s, using: %s\n", appData, dataDir)
	}

	return dataDir, nil
}

// fileExists checks if a file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

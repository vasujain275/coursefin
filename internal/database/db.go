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

	_ "github.com/mattn/go-sqlite3" // SQLite driver
	"github.com/pressly/goose/v3"

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
	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "coursefin.db")

	// Open SQLite connection with recommended settings
	// - Busy timeout: 5s (handle concurrent writes)
	// - Journal mode: WAL (Write-Ahead Logging for better concurrency)
	// - Synchronous: NORMAL (good balance of safety and performance)
	// - Foreign keys: ON (enforce referential integrity)
	// - Cache size: 10MB (speed up queries)
	conn, err := sql.Open("sqlite3", fmt.Sprintf("%s?_busy_timeout=5000&_journal_mode=WAL&_synchronous=NORMAL&_foreign_keys=ON&cache=shared", dbPath))
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	conn.SetMaxOpenConns(1) // SQLite works best with single writer
	conn.SetMaxIdleConns(1)

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

	return db, nil
}

// runMigrations applies all pending database migrations using goose
func (db *DB) runMigrations() error {
	// Set goose to use embedded filesystem
	goose.SetBaseFS(embedMigrations)

	// Configure goose for SQLite
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
			dataDir = filepath.Join(homeDir, "AppData", "Roaming", "coursefin")
		}
	}

	return dataDir, nil
}

// fileExists checks if a file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

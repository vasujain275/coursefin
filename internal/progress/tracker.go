// ============================================================================
// Package progress - Video Progress Tracking Service
// ============================================================================
// Purpose: Bridge between web player and database for progress tracking
// Features:
//   - Auto-save progress every 5 seconds during playback
//   - Auto-mark lectures complete at 90% threshold
//   - Resume functionality (load last position)
//   - Watch statistics (count, timestamps)
// ============================================================================

package progress

import (
	"context"
	"fmt"
	"sync"
	"time"

	"coursefin/internal/database"
	"coursefin/internal/sqlc"
)

// Tracker manages progress tracking for video playback
type Tracker struct {
	db                *database.DB
	ctx               context.Context
	cancel            context.CancelFunc
	currentLectureID  int64
	completionPercent float64
	saveInterval      time.Duration
	mu                sync.Mutex
	tracking          bool
}

// NewTracker creates a new progress tracker
func NewTracker(db *database.DB) *Tracker {
	return &Tracker{
		db:                db,
		completionPercent: 0.90, // 90% threshold for auto-complete
		saveInterval:      5 * time.Second,
	}
}

// SetCompletionThreshold sets the percentage threshold for auto-marking complete
// Default is 0.90 (90%). Value should be between 0.0 and 1.0
func (t *Tracker) SetCompletionThreshold(percent float64) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.completionPercent = percent
}

// SetSaveInterval sets how often progress is saved during playback
// Default is 5 seconds
func (t *Tracker) SetSaveInterval(interval time.Duration) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.saveInterval = interval
}

// StartTracking begins tracking progress for a lecture
// This should be called when a video starts playing
func (t *Tracker) StartTracking(ctx context.Context, lectureID int64) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Stop any existing tracking
	if t.tracking {
		if t.cancel != nil {
			t.cancel()
		}
	}

	t.currentLectureID = lectureID
	t.ctx, t.cancel = context.WithCancel(ctx)
	t.tracking = true

	// Start periodic progress saving
	go t.trackLoop()

	// Update first_watched_at and increment watch_count
	return t.recordStartWatching(lectureID)
}

// StopTracking stops tracking the current lecture
func (t *Tracker) StopTracking() error {
	t.mu.Lock()
	defer t.mu.Unlock()

	if !t.tracking {
		return nil
	}

	if t.cancel != nil {
		t.cancel()
	}

	// Save one final time before stopping
	err := t.saveCurrentProgress()

	t.tracking = false
	t.currentLectureID = 0
	t.ctx = nil
	t.cancel = nil

	return err
}

// GetResumePosition returns the last playback position for a lecture
// Returns 0 if no progress exists or if lecture was completed
func (t *Tracker) GetResumePosition(ctx context.Context, lectureID int64) (float64, error) {
	progress, err := t.db.Queries().GetProgressByLecture(ctx, lectureID)
	if err != nil {
		// No progress record exists
		return 0, nil
	}

	// If completed, start from beginning
	if progress.Completed != nil && *progress.Completed {
		return 0, nil
	}

	// Return last position in seconds
	if progress.LastPosition != nil {
		return float64(*progress.LastPosition), nil
	}

	return 0, nil
}

// trackLoop periodically saves progress while tracking is active
func (t *Tracker) trackLoop() {
	ticker := time.NewTicker(t.saveInterval)
	defer ticker.Stop()

	for {
		select {
		case <-t.ctx.Done():
			return
		case <-ticker.C:
			// TODO: Implement web player progress tracking
			// For now, tracking is disabled until web player is integrated
			// t.mu.Lock()
			// if t.tracking {
			// 	t.saveCurrentProgress()
			// }
			// t.mu.Unlock()
		}
	}
}

// saveCurrentProgress saves the current playback state to database
func (t *Tracker) saveCurrentProgress() error {
	// TODO: Implement web player progress tracking
	// This will be called from frontend with position/duration
	return nil

	// Original MPV-based implementation (commented out for now):
	// if !t.player.IsRunning() {
	// 	return nil
	// }
	//
	// // Get current playback state
	// position, err := t.player.GetPosition()
	// if err != nil {
	// 	return fmt.Errorf("failed to get position: %w", err)
	// }
	//
	// duration, err := t.player.GetDuration()
	// if err != nil {
	// 	return fmt.Errorf("failed to get duration: %w", err)
	// }
	//
	// // Calculate if lecture should be marked complete
	// completed := (position / duration) >= t.completionPercent
	//
	// // Get lecture info to find course_id
	// lecture, err := t.db.Queries().GetLectureByID(t.ctx, t.currentLectureID)
	// if err != nil {
	// 	return fmt.Errorf("failed to get lecture: %w", err)
	// }
	//
	// // Upsert progress record
	// _, err = t.db.Queries().UpsertProgress(t.ctx, sqlc.UpsertProgressParams{
	// 	LectureID:       t.currentLectureID,
	// 	CourseID:        lecture.CourseID,
	// 	WatchedDuration: func() *int64 { v := int64(position); return &v }(),
	// 	TotalDuration:   func() *int64 { v := int64(duration); return &v }(),
	// 	LastPosition:    func() *int64 { v := int64(position); return &v }(),
	// 	Completed:       &completed,
	// 	LastWatchedAt:   func() *time.Time { t := time.Now(); return &t }(),
	// })
	//
	// return err
}

// recordStartWatching updates watch statistics when lecture starts
func (t *Tracker) recordStartWatching(lectureID int64) error {
	// Check if progress record exists
	progress, err := t.db.Queries().GetProgressByLecture(t.ctx, lectureID)
	if err != nil {
		// No progress record exists, create one
		lecture, err := t.db.Queries().GetLectureByID(t.ctx, lectureID)
		if err != nil {
			return fmt.Errorf("failed to get lecture: %w", err)
		}

		now := time.Now()
		completed := false
		watchCount := int64(1)
		watchedDuration := int64(0)
		lastPosition := int64(0)

		_, err = t.db.Queries().CreateProgress(t.ctx, sqlc.CreateProgressParams{
			LectureID:       lectureID,
			CourseID:        lecture.CourseID,
			WatchedDuration: &watchedDuration,
			TotalDuration:   lecture.Duration,
			LastPosition:    &lastPosition,
			Completed:       &completed,
			WatchCount:      &watchCount,
			FirstWatchedAt:  &now,
			LastWatchedAt:   &now,
		})
		return err
	}

	// Progress record exists, increment watch count
	if progress.FirstWatchedAt == nil {
		// This shouldn't happen, but set it if missing
		now := time.Now()
		progress.FirstWatchedAt = &now
	}

	return t.db.Queries().IncrementWatchCount(t.ctx, lectureID)
}

// IsTracking returns whether tracking is currently active
func (t *Tracker) IsTracking() bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.tracking
}

// GetCurrentLectureID returns the ID of the currently tracked lecture
func (t *Tracker) GetCurrentLectureID() int64 {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.currentLectureID
}

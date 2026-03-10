// ============================================================================
// TypeScript Type Definitions - CourseFin
// ============================================================================
// Purpose: Shared types for the entire frontend application
// ============================================================================

// ============================================================================
// Course Types
// ============================================================================

export interface Lecture {
  id: number;
  sectionId: number;
  courseId: number;
  title: string;
  lectureNumber: number;
  lectureType: string;
  isQuiz?: boolean;
  isDownloadable?: boolean;
  filePath: string;
  originalFilename?: string;
  resourcesPath?: string;
  fileSize?: number;
  duration?: number;
  videoCodec?: string;
  resolution?: string;
  hasSubtitles?: boolean;
  createdAt?: string;
  // Optional computed fields (added during conversion)
  orderIndex?: number;
  subtitlePath?: string;
  isCompleted?: boolean;
}

// Lecture with progress data (from ListLecturesWithProgressBySection)
export interface LectureWithProgress extends Lecture {
  isCompleted: boolean;
  lastPosition?: number;
  watchCount?: number;
}

export interface Section {
  id: number;
  courseId: number;
  title: string;
  sectionNumber: number;
  description?: string;
  createdAt?: string;
  // Optional computed fields (added during conversion)
  orderIndex?: number;
  // Optional nested lectures (populated during conversion or from SectionWithLectures)
  lectures?: LectureWithProgress[];
}

// Section with all its lectures (from GetCourseWithSections)
export interface SectionWithLectures extends Omit<Section, 'lectures'> {
  lectures: LectureWithProgress[];
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  instructorName?: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  coursePath: string;
  totalDuration?: number;
  totalLectures?: number;
  createdAt?: string;
  updatedAt?: string;
  // Optional progress fields (populated from ListCoursesWithProgress)
  completedLectures?: number;
  progressPercent?: number;
  hasProgress?: boolean;
  lastWatchedAt?: string;
  // Optional nested sections with lectures
  sections?: (Section | SectionWithLectures)[];
}

// Course with progress metrics (from ListCoursesWithProgress)
export interface CourseWithProgress extends Course {
  completedLectures: number;
  completionPercentage: number;
}

// Course with all its sections and lectures (from GetCourseWithSections)
export interface CourseWithSections extends Course {
  sections: SectionWithLectures[];
}

// ============================================================================
// Lecture Progress Types
// ============================================================================

// Progress record for a lecture (from Progress model)
export interface LectureProgress {
  id: number;
  lectureId: number;
  courseId: number;
  watchedDuration?: number;
  totalDuration?: number;
  lastPosition?: number;
  completed?: boolean;
  watchCount?: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
  updatedAt?: string;
}

// Subtitle track for a lecture (from Subtitle model)
export interface SubtitleTrack {
  id: number;
  lectureId: number;
  language: string;
  format: string;
  filePath: string;
  createdAt?: string;
}

// Player-specific lecture info (from player.LectureInfo)
export interface LectureInfo {
  lectureId: number;
  title: string;
  videoUrl: string;
  subtitleUrl: string;
  duration: number;
  resumeAt: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextId?: number;
  previousId?: number;
}

// Video player state
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  buffered: number;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface AppSettings {
  firstRun: boolean;
  coursesDirectory?: string;
  theme: 'light' | 'dark' | 'system';
  defaultPlaybackSpeed: number;
  autoMarkCompleteThreshold: number;
  subtitleLanguagePreference: string;
  autoPlayNext: boolean;
  resumePrompt: boolean;
  thumbnailCacheEnabled: boolean;
  scanOnStartup: boolean;
}

// ============================================================================
// Onboarding Types
// ============================================================================

export interface OnboardingState {
  step: number;
  totalSteps: number;
  coursesDirectory?: string;
  completedSteps: number[];
}

// ============================================================================
// Course Import Types
// ============================================================================

export interface ScanLibraryResult {
  coursesAdded: number;
  coursesSkipped: number;  // already existed in DB
  errors: string[];        // non-fatal per-folder errors
}

// ============================================================================
// UI State Types
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  title?: string;
}

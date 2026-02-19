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
  orderIndex: number;
  lectureType: string;
  isQuiz?: boolean;
  isDownloadable?: boolean;
  filePath: string;
  subtitlePath?: string;
  originalFilename?: string;
  resourcesPath?: string;
  fileSize?: number;
  duration: number;
  videoCodec?: string;
  resolution?: string;
  hasSubtitles?: boolean;
  isCompleted: boolean;
  createdAt?: string;
}

export interface Section {
  id: number;
  courseId: number;
  title: string;
  sectionNumber: number;
  orderIndex: number;
  description?: string;
  lectures: Lecture[];
  createdAt?: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  instructorName?: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  coursePath: string;           // ABSOLUTE path to course folder
  totalDuration: number;
  totalLectures?: number;
  createdAt?: string;
  updatedAt?: string;
  progress?: number;            // Computed progress percentage (0-100)
  sections?: Section[];         // Only populated when fetching with GetCourseWithSections
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

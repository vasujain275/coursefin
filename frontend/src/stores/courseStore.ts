// ============================================================================
// Course Store - CourseFin
// ============================================================================
// Purpose: Global state management for course library with progress tracking
// Pattern: Zustand store with Wails backend integration
// ============================================================================

import type { Course } from '@/types';
import { create } from 'zustand';

interface CourseState {
  courses: Course[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCourses: () => Promise<void>;
  refreshCourses: () => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,

  loadCourses: async () => {
    // Skip if already loaded and not empty
    if (get().courses.length > 0 && !get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const { GetAllCourses } = await import('@/wailsjs/go/main/App');
      const rawCourses = await GetAllCourses();
      const courses: Course[] = (rawCourses || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        instructorName: c.instructor_name,
        thumbnailUrl: c.thumbnail_url,
        thumbnailPath: c.thumbnail_path,
        coursePath: c.course_path,
        totalDuration: c.total_duration || 0,
        totalLectures: c.total_lectures,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        // Progress fields from ListCoursesWithProgress
        completedLectures: c.completed_lectures ?? 0,
        progressPercent: c.completion_percentage ?? 0,
        lastWatchedAt: c.last_watched_at,
        hasProgress: (c.has_progress ?? 0) > 0,
      }));
      set({ courses, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load courses',
        isLoading: false,
      });
    }
  },

  refreshCourses: async () => {
    // Force reload regardless of current state
    set({ isLoading: true, error: null });
    try {
      const { GetAllCourses } = await import('@/wailsjs/go/main/App');
      const rawCourses = await GetAllCourses();
      const courses: Course[] = (rawCourses || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        instructorName: c.instructor_name,
        thumbnailUrl: c.thumbnail_url,
        thumbnailPath: c.thumbnail_path,
        coursePath: c.course_path,
        totalDuration: c.total_duration || 0,
        totalLectures: c.total_lectures,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        completedLectures: c.completed_lectures ?? 0,
        progressPercent: c.completion_percentage ?? 0,
        lastWatchedAt: c.last_watched_at,
        hasProgress: (c.has_progress ?? 0) > 0,
      }));
      set({ courses, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load courses',
        isLoading: false,
      });
    }
  },
}));

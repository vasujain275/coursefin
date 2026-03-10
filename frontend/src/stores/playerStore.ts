// ============================================================================
// Player Store - CourseFin
// ============================================================================
// Purpose: Global state management for the course player view
// Pattern: Zustand store with Wails backend integration
// ============================================================================

import type { CourseWithSections, Lecture, LectureWithProgress, SectionWithLectures } from '@/types';
import type { course, sqlc } from '@/wailsjs/go/models';
import { create } from 'zustand';

interface PlayerState {
  course: CourseWithSections | null;
  currentLecture: Lecture | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCourse: (courseId: number, initialLectureId?: number) => Promise<void>;
  setCurrentLecture: (lecture: Lecture) => void;
  markLectureCompleted: (lectureId: number) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  hasNext: () => boolean;
  hasPrevious: () => boolean;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  course: null,
  currentLecture: null,
  isLoading: false,
  error: null,

  loadCourse: async (courseId: number, initialLectureId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const { GetCourseWithSections } = await import('@/wailsjs/go/main/App');
      const courseData = await GetCourseWithSections(courseId);

      if (!courseData) {
        throw new Error('No course data returned');
      }

      if (!courseData.sections || courseData.sections.length === 0) {
        throw new Error('Course has no sections');
      }

      // Convert backend data to frontend types
      const convertedCourse: CourseWithSections = {
        id: courseData.id,
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        instructorName: courseData.instructor_name,
        thumbnailUrl: courseData.thumbnail_url,
        thumbnailPath: courseData.thumbnail_path,
        coursePath: courseData.course_path,
        totalDuration: courseData.total_duration || 0,
        totalLectures: courseData.total_lectures,
        createdAt: courseData.created_at,
        updatedAt: courseData.updated_at,
        sections: courseData.sections.map((section: course.SectionWithLectures, sectionIdx: number) => {
          const convertedSection: SectionWithLectures = {
            id: section.id,
            courseId: section.course_id,
            title: section.title,
            sectionNumber: section.section_number,
            orderIndex: sectionIdx,
            description: section.description,
            createdAt: section.created_at,
            lectures: section.lectures.map((lecture: sqlc.ListLecturesWithProgressBySectionRow, lectureIdx: number) => {
              const convertedLecture: LectureWithProgress = {
                id: lecture.id,
                sectionId: lecture.section_id,
                courseId: lecture.course_id,
                title: lecture.title,
                lectureNumber: lecture.lecture_number,
                orderIndex: lectureIdx,
                lectureType: lecture.lecture_type,
                isQuiz: lecture.is_quiz,
                isDownloadable: lecture.is_downloadable,
                filePath: lecture.file_path,
                subtitlePath: undefined,
                originalFilename: lecture.original_filename,
                resourcesPath: lecture.resources_path,
                fileSize: lecture.file_size,
                duration: lecture.duration || 0,
                videoCodec: lecture.video_codec,
                resolution: lecture.resolution,
                hasSubtitles: lecture.has_subtitles,
                isCompleted: lecture.is_completed ?? false,
                createdAt: lecture.created_at,
              };
              return convertedLecture;
            }),
          };
          return convertedSection;
        }),
      };

      // Find initial lecture
      let initialLecture: Lecture | null = null;
      if (initialLectureId) {
        for (const section of convertedCourse.sections) {
          const found = section.lectures.find(l => l.id === initialLectureId);
          if (found) {
            initialLecture = found;
            break;
          }
        }
      }
      if (!initialLecture && convertedCourse.sections.length > 0 && convertedCourse.sections[0].lectures.length > 0) {
        initialLecture = convertedCourse.sections[0].lectures[0];
      }

      set({
        course: convertedCourse,
        currentLecture: initialLecture,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load course',
        isLoading: false,
      });
    }
  },

  setCurrentLecture: (lecture: Lecture) => {
    set({ currentLecture: lecture });
  },

  markLectureCompleted: (lectureId: number) => {
    const { course } = get();
    if (!course) return;

    const updatedSections = course.sections.map(section => ({
      ...section,
      lectures: section.lectures.map(lecture =>
        lecture.id === lectureId ? { ...lecture, isCompleted: true } : lecture
      ),
    }));

    set({
      course: { ...course, sections: updatedSections },
    });
  },

  navigateNext: () => {
    const { course, currentLecture } = get();
    if (!course || !currentLecture) return;

    const allLectures = course.sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);

    if (currentIndex >= 0 && currentIndex < allLectures.length - 1) {
      set({ currentLecture: allLectures[currentIndex + 1] });
    }
  },

  navigatePrevious: () => {
    const { course, currentLecture } = get();
    if (!course || !currentLecture) return;

    const allLectures = course.sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);

    if (currentIndex > 0) {
      set({ currentLecture: allLectures[currentIndex - 1] });
    }
  },

  hasNext: () => {
    const { course, currentLecture } = get();
    if (!course || !currentLecture) return false;
    const allLectures = course.sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);
    return currentIndex >= 0 && currentIndex < allLectures.length - 1;
  },

  hasPrevious: () => {
    const { course, currentLecture } = get();
    if (!course || !currentLecture) return false;
    const allLectures = course.sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);
    return currentIndex > 0;
  },

  reset: () => {
    set({
      course: null,
      currentLecture: null,
      isLoading: false,
      error: null,
    });
  },
}));

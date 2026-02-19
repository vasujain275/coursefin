// ============================================================================
// PlayerView - CourseFin
// ============================================================================
// Purpose: Main player container with sidebar navigation
// Architecture: Switches between VideoPlayer and HtmlLectureViewer
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './VideoPlayer';
import { HtmlLectureViewer } from './HtmlLectureViewer';
import { LectureList } from './LectureList';
import { GetCourseWithSections, GetCoursesDirectory, GetLectureForPlayer } from '@/wailsjs/go/main/App';
import type { Course, Lecture, Section } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';

interface PlayerViewProps {
  courseId: number;
  initialLectureId?: number;
  onBack?: () => void;
}

// VideoPlayerWrapper - Loads lecture info from backend
interface VideoPlayerWrapperProps {
  lectureId: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
}

function VideoPlayerWrapper({ 
  lectureId, 
  hasNext, 
  hasPrevious, 
  onNavigateNext, 
  onNavigatePrevious 
}: VideoPlayerWrapperProps) {
  const [lectureInfo, setLectureInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const loadLectureInfo = async () => {
      try {
        setLoading(true);
        const info = await GetLectureForPlayer(lectureId);
        setLectureInfo({
          ...info,
          HasNext: hasNext,
          HasPrevious: hasPrevious,
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
        setLoading(false);
      }
    };
    
    void loadLectureInfo();
  }, [lectureId, hasNext, hasPrevious]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading video...</p>
      </div>
    );
  }

  if (error || !lectureInfo) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-destructive">Failed to Load Video</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayer
      lectureInfo={lectureInfo}
      onNavigateNext={onNavigateNext}
      onNavigatePrevious={onNavigatePrevious}
    />
  );
}

export function PlayerView({ courseId, initialLectureId, onBack }: PlayerViewProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [showSidebar, setShowSidebar] = useState(true);
  const [coursesDir, setCoursesDir] = useState<string>('');

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true);
        console.log('[PlayerView] Loading course:', courseId);
        
        // Get courses directory first
        const dir = await GetCoursesDirectory();
        console.log('[PlayerView] Courses directory:', dir);
        setCoursesDir(dir);
        
        const courseData = await GetCourseWithSections(courseId);
        console.log('[PlayerView] Course data received:', courseData);
        
        if (!courseData) {
          throw new Error('No course data returned');
        }
        
        if (!courseData.sections || courseData.sections.length === 0) {
          throw new Error('Course has no sections');
        }
        
        // Convert backend data to frontend types
        const convertedCourse: Course = {
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
          sections: courseData.sections.map((section, sectionIdx) => {
            const convertedSection: Section = {
              id: section.id,
              courseId: section.course_id,
              title: section.title,
              sectionNumber: section.section_number,
              orderIndex: sectionIdx,
              description: section.description,
              createdAt: section.created_at,
              lectures: section.lectures.map((lecture, lectureIdx) => {
                const convertedLecture: Lecture = {
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
                  subtitlePath: undefined, // Will be populated from subtitles table later
                  originalFilename: lecture.original_filename,
                  resourcesPath: lecture.resources_path,
                  fileSize: lecture.file_size,
                  duration: lecture.duration || 0,
                  videoCodec: lecture.video_codec,
                  resolution: lecture.resolution,
                  hasSubtitles: lecture.has_subtitles,
                  isCompleted: false, // Will be populated from progress later
                  createdAt: lecture.created_at,
                };
                return convertedLecture;
              }),
            };
            return convertedSection;
          }),
        };
        
        console.log('[PlayerView] Converted course:', convertedCourse);
        setCourse(convertedCourse);
        
        // Set initial lecture
        if (initialLectureId) {
          const lecture = findLectureById(convertedCourse, initialLectureId);
          console.log('[PlayerView] Found lecture by ID:', lecture);
          setCurrentLecture(lecture);
        } else {
          const firstLecture = getFirstLecture(convertedCourse);
          console.log('[PlayerView] Using first lecture:', firstLecture);
          setCurrentLecture(firstLecture);
        }
        
        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load course data';
        console.error('[PlayerView] Error loading course:', err);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    void loadCourse();
  }, [courseId, initialLectureId]);

  const findLectureById = (courseData: Course, lectureId: number): Lecture | null => {
    if (!courseData.sections) return null;
    for (const section of courseData.sections) {
      const lecture = section.lectures.find(l => l.id === lectureId);
      if (lecture) return lecture;
    }
    return null;
  };

  const getFirstLecture = (courseData: Course): Lecture | null => {
    if (courseData.sections && courseData.sections.length > 0 && courseData.sections[0].lectures.length > 0) {
      return courseData.sections[0].lectures[0];
    }
    return null;
  };

  const handleLectureSelect = (lecture: Lecture) => {
    setCurrentLecture(lecture);
  };

  const handleNavigateNext = () => {
    if (!course || !currentLecture || !course.sections) return;

    const allLectures = course.sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);

    if (currentIndex >= 0 && currentIndex < allLectures.length - 1) {
      setCurrentLecture(allLectures[currentIndex + 1]);
    }
  };

  const handleNavigatePrevious = () => {
    if (!course || !currentLecture || !course.sections) return;

    const allLectures = course.sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);

    if (currentIndex > 0) {
      setCurrentLecture(allLectures[currentIndex - 1]);
    }
  };

  const hasNextLecture = () => {
    if (!course || !currentLecture || !course.sections) return false;
    const allLectures = course.sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);
    return currentIndex >= 0 && currentIndex < allLectures.length - 1;
  };

  const hasPreviousLecture = () => {
    if (!course || !currentLecture || !course.sections) return false;
    const allLectures = course.sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l.id === currentLecture.id);
    return currentIndex > 0;
  };

  const isVideoLecture = (lecture: Lecture) => {
    return lecture.filePath.toLowerCase().endsWith('.mp4');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <svg className="w-12 h-12 text-destructive mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-lg font-medium text-foreground">Failed to Load Course</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  // No lectures state
  if (!currentLecture) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <svg className="w-12 h-12 text-muted-foreground mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="text-lg font-medium text-foreground">No Lectures Available</p>
            <p className="text-sm text-muted-foreground mt-1">This course doesn't have any lectures yet.</p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Player Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          {/* Back Button */}
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Course
            </Button>
          )}

          {/* Course Title */}
          <div className="flex-1 px-4 text-center">
            <h1 className="text-lg font-semibold text-foreground line-clamp-1">
              {course.title}
            </h1>
          </div>

          {/* Toggle Sidebar Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Hide Sidebar
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                Show Sidebar
              </>
            )}
          </Button>
        </div>

        {/* Player Component */}
        <div className="flex-1 overflow-hidden">
          {isVideoLecture(currentLecture) ? (
            <VideoPlayerWrapper
              lectureId={currentLecture.id}
              hasNext={hasNextLecture()}
              hasPrevious={hasPreviousLecture()}
              onNavigateNext={handleNavigateNext}
              onNavigatePrevious={handleNavigatePrevious}
            />
          ) : (
            <HtmlLectureViewer
              lectureId={currentLecture.id}
              title={currentLecture.title}
              htmlFilePath={`${coursesDir}/${currentLecture.filePath}`}
              onNavigateNext={handleNavigateNext}
              onNavigatePrevious={handleNavigatePrevious}
              hasNext={hasNextLecture()}
              hasPrevious={hasPreviousLecture()}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && course.sections && (
        <div className="w-96 flex-shrink-0">
          <LectureList
            sections={course.sections}
            currentLectureId={currentLecture.id}
            onLectureSelect={handleLectureSelect}
            onClose={() => setShowSidebar(false)}
          />
        </div>
      )}
    </div>
  );
}

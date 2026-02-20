// ============================================================================
// PlayerView - CourseFin
// ============================================================================
// Purpose: Main player container with sidebar navigation
// Architecture: Switches between VideoPlayer and HtmlLectureViewer
// ============================================================================

import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import type { Course, Lecture, Section } from '@/types';
import { GetCourseWithSections, GetLectureForPlayer, IsWindowFullscreen } from '@/wailsjs/go/main/App';
import { AlertCircle, ArrowLeft, FileText, Loader2, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HtmlLectureViewer } from './HtmlLectureViewer';
import { LectureList } from './LectureList';
import { VideoPlayer } from './VideoPlayer';

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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !lectureInfo) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Poll for fullscreen state changes
  useEffect(() => {
    const checkFullscreen = async () => {
      const fullscreen = await IsWindowFullscreen();
      setIsFullscreen(fullscreen);
    };

    // Check immediately
    void checkFullscreen();

    // Poll every 500ms
    const interval = setInterval(() => {
      void checkFullscreen();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true);
        console.log('[PlayerView] Loading course:', courseId);

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
          sections: courseData.sections.map((section: any, sectionIdx: number) => {
            const convertedSection: Section = {
              id: section.id,
              courseId: section.course_id,
              title: section.title,
              sectionNumber: section.section_number,
              orderIndex: sectionIdx,
              description: section.description,
              createdAt: section.created_at,
              lectures: section.lectures.map((lecture: any, lectureIdx: number) => {
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
                  subtitlePath: undefined,
                  originalFilename: lecture.original_filename,
                  resourcesPath: lecture.resources_path,
                  fileSize: lecture.file_size,
                  duration: lecture.duration || 0,
                  videoCodec: lecture.video_codec,
                  resolution: lecture.resolution,
                  hasSubtitles: lecture.has_subtitles,
                  isCompleted: false,
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
    // Primary check: use the DB-sourced lecture type
    if (lecture.lectureType === 'text') return false;
    if (lecture.lectureType === 'video') return true;
    // Fallback: check file extension (guards against stale/missing type data)
    const ext = lecture.filePath?.toLowerCase() ?? '';
    return !ext.endsWith('.html') && !ext.endsWith('.htm');
  };


  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-fade-in">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <div>
            <p className="text-lg font-medium text-foreground">Failed to Load Course</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="border-border/50">
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
        <div className="text-center space-y-4 animate-fade-in">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <p className="text-lg font-medium text-foreground">No Lectures Available</p>
            <p className="text-sm text-muted-foreground mt-1">This course doesn't have any lectures yet.</p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="border-border/50">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Hidden in fullscreen */}
        {!isFullscreen && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/95 wails-drag">
            {/* Back Button */}
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground wails-no-drag">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}

            {/* Course Title */}
            <div className="flex-1 px-4 text-center">
              <h1 className="text-sm font-semibold text-foreground line-clamp-1">
                {course.title}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <ThemeToggle />

              {/* Toggle Sidebar Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="gap-2 text-muted-foreground hover:text-foreground wails-no-drag"
              >
                {showSidebar ? (
                  <>
                    <PanelRightClose className="w-4 h-4" />
                    <span className="hidden sm:inline">Hide</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Content</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

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
              hasNext={hasNextLecture()}
              hasPrevious={hasPreviousLecture()}
              onNavigateNext={handleNavigateNext}
              onNavigatePrevious={handleNavigatePrevious}
            />
          )}
        </div>
      </div>

      {/* Sidebar - Hidden in fullscreen */}
      {!isFullscreen && showSidebar && course.sections && (
        <div className="w-96 flex-shrink-0 border-l border-border/50">
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

// ============================================================================
// PlayerView - CourseFin
// ============================================================================
// Purpose: Main player container with sidebar navigation
// Architecture: Switches between VideoPlayer and HtmlLectureViewer
// ============================================================================

import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import type { Lecture } from '@/types';
import { isVideoLecture } from '@/lib/utils';
import { GetLectureForPlayer } from '@/wailsjs/go/main/App';
import { EventsOff, EventsOn } from '@/wailsjs/runtime/runtime';
import { usePlayerStore } from '@/stores/playerStore';
import { useShallow } from 'zustand/react/shallow';
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
  const {
    course,
    currentLecture,
    isLoading,
    error,
    loadCourse,
    setCurrentLecture,
    navigateNext,
    navigatePrevious,
    hasNext,
    hasPrevious,
    reset,
  } = usePlayerStore(useShallow(state => ({
    course: state.course,
    currentLecture: state.currentLecture,
    isLoading: state.isLoading,
    error: state.error,
    loadCourse: state.loadCourse,
    setCurrentLecture: state.setCurrentLecture,
    navigateNext: state.navigateNext,
    navigatePrevious: state.navigatePrevious,
    hasNext: state.hasNext,
    hasPrevious: state.hasPrevious,
    reset: state.reset,
  })));

  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    EventsOn('window:fullscreen', (isFs: boolean) => setIsFullscreen(isFs));

    return () => EventsOff('window:fullscreen');
  }, []);

  useEffect(() => {
    void loadCourse(courseId, initialLectureId);

    return () => {
      reset();
    };
  }, [courseId, initialLectureId, loadCourse, reset]);

  const handleLectureSelect = (lecture: Lecture) => {
    setCurrentLecture(lecture);
  };

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
      <div className="flex-1 flex flex-col min-w-0">
        {!isFullscreen && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/95 wails-drag">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground wails-no-drag">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}

            <div className="flex-1 px-4 text-center">
              <h1 className="text-sm font-semibold text-foreground line-clamp-1">
                {course.title}
              </h1>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />

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

        <div className="flex-1 overflow-hidden">
          {isVideoLecture(currentLecture) ? (
            <VideoPlayerWrapper
              lectureId={currentLecture.id}
              hasNext={hasNext()}
              hasPrevious={hasPrevious()}
              onNavigateNext={navigateNext}
              onNavigatePrevious={navigatePrevious}
            />
          ) : (
            <HtmlLectureViewer
              lectureId={currentLecture.id}
              title={currentLecture.title}
              hasNext={hasNext()}
              hasPrevious={hasPrevious()}
              onNavigateNext={navigateNext}
              onNavigatePrevious={navigatePrevious}
            />
          )}
        </div>
      </div>

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

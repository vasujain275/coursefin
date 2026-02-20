import { Button } from '@/components/ui/button';
import {
    GetVideoResumePosition,
    StartLectureWatch,
    UpdateVideoProgress,
} from '@/wailsjs/go/main/App';
import type { player } from '@/wailsjs/go/models';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  lectureInfo: player.LectureInfo;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
}

export function VideoPlayer({
  lectureInfo,
  onNavigateNext,
  onNavigatePrevious,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('[VideoPlayer] Initializing with lectureInfo:', lectureInfo);
    console.log('[VideoPlayer] Video URL:', lectureInfo.VideoURL);
    console.log('[VideoPlayer] Subtitle URL:', lectureInfo.SubtitleURL);

    // Reset state for new video
    setIsLoading(true);
    setError(null);

    // Load resume position
    const loadResumePosition = async () => {
      try {
        const resumeAt = await GetVideoResumePosition(lectureInfo.LectureID);
        if (resumeAt > 0 && video) {
          video.currentTime = resumeAt;
        }
      } catch (err) {
        console.error('Failed to load resume position:', err);
      }
    };

    // Start watch session
    const startSession = async () => {
      try {
        await StartLectureWatch(lectureInfo.LectureID);
      } catch (err) {
        console.error('Failed to start watch session:', err);
      }
    };

    // Handle video loaded
    const handleLoadedData = () => {
      console.log('[VideoPlayer] Video loaded successfully');
      setIsLoading(false);
      void loadResumePosition();
    };

    // Handle video can play
    const handleCanPlay = () => {
      console.log('[VideoPlayer] Video can play');
      setIsLoading(false);
    };

    // Handle video error
    const handleError = () => {
      const videoError = video.error;
      console.error('[VideoPlayer] Video error:', videoError);
      console.error('[VideoPlayer] Video src:', video.src);
      setIsLoading(false);
      setError(`Failed to load video: ${videoError?.message || 'Unknown error'}`);
    };

    // Handle play event
    const handlePlay = () => {
      // Start progress tracking interval (every 5 seconds)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      progressIntervalRef.current = window.setInterval(() => {
        void saveProgress();
      }, 5000);
    };

    // Handle pause event
    const handlePause = () => {
      // Save progress immediately when pausing
      void saveProgress();

      // Clear interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    // Handle seeking
    const handleSeeked = () => {
      // Save progress after seeking
      void saveProgress();
    };

    // Save progress function
    const saveProgress = async () => {
      if (!video) return;
      try {
        await UpdateVideoProgress(
          lectureInfo.LectureID,
          video.currentTime,
          video.duration,
        );
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    };

    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);

    // Start watch session
    void startSession();

    // Cleanup
    return () => {
      // Save final progress
      void saveProgress();

      // Clear interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Remove event listeners
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [lectureInfo.LectureID]);

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Don't interfere with inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.requestFullscreen();
          }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          video.muted = !video.muted;
          break;
        case 'n':
        case 'N':
          if (lectureInfo.HasNext && onNavigateNext) {
            onNavigateNext();
          }
          break;
        case 'p':
        case 'P':
          if (lectureInfo.HasPrevious && onNavigatePrevious) {
            onNavigatePrevious();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lectureInfo, onNavigateNext, onNavigatePrevious]);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <div className="text-center max-w-lg px-4">
            <p className="text-lg text-destructive">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground mono break-all">
              Video Path: {lectureInfo.VideoURL}
            </p>
          </div>
        </div>
      )}

      {/* Video Element - Native HTML5 with controls */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="max-h-full max-w-full"
          controls
          autoPlay={false}
          preload="metadata"
          src={lectureInfo.VideoURL}
        >
          {/* Subtitle track */}
          {lectureInfo.SubtitleURL && (
            <track
              kind="captions"
              label="English"
              srcLang="en"
              src={lectureInfo.SubtitleURL}
              default
            />
          )}
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t border-border/50 bg-card/80 backdrop-blur-xl p-4">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="default"
          onClick={onNavigatePrevious}
          disabled={!lectureInfo.HasPrevious}
          aria-label="Previous lecture (P)"
          className="gap-2 border-border/50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Lecture Info */}
        <div className="flex-1 px-4 text-center">
          <h2 className="line-clamp-1 text-base font-semibold">
            {lectureInfo.Title}
          </h2>
          {lectureInfo.Duration > 0 && (
            <p className="text-xs text-muted-foreground mono">
              Duration: {formatDuration(lectureInfo.Duration)}
            </p>
          )}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="default"
          onClick={onNavigateNext}
          disabled={!lectureInfo.HasNext}
          aria-label="Next lecture (N)"
          className="gap-2 border-border/50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

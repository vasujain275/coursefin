import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { 
  UpdateVideoProgress, 
  StartLectureWatch, 
  GetVideoResumePosition 
} from '@/wailsjs/go/main/App';
import { player } from '@/wailsjs/go/models';

interface VideoPlayerProps {
  lectureInfo: player.LectureInfo;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
}

export function VideoPlayer({ 
  lectureInfo, 
  onNavigateNext, 
  onNavigatePrevious 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Plyr
    const player = new Plyr(videoRef.current, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      settings: ['captions', 'quality', 'speed'],
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      captions: { active: true, update: true },
    });

    playerRef.current = player;

    // Load resume position
    const loadResumePosition = async () => {
      try {
        const resumeAt = await GetVideoResumePosition(lectureInfo.LectureID);
        if (resumeAt > 0) {
          player.currentTime = resumeAt;
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
      setIsLoading(false);
      loadResumePosition();
    };

    // Handle video error
    const handleError = () => {
      setIsLoading(false);
      setError('Failed to load video. Please check the file path.');
    };

    // Handle play event
    const handlePlay = () => {
      // Start progress tracking interval (every 5 seconds)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      progressIntervalRef.current = window.setInterval(() => {
        saveProgress();
      }, 5000);
    };

    // Handle pause event
    const handlePause = () => {
      // Save progress immediately when pausing
      saveProgress();
      
      // Clear interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    // Handle seeking
    const handleSeeked = () => {
      // Save progress after seeking
      saveProgress();
    };

    // Save progress function
    const saveProgress = async () => {
      if (!player) return;
      
      try {
        await UpdateVideoProgress(
          lectureInfo.LectureID,
          player.currentTime,
          player.duration
        );
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    };

    // Add event listeners
    player.on('loadeddata', handleLoadedData);
    player.on('error', handleError);
    player.on('play', handlePlay);
    player.on('pause', handlePause);
    player.on('seeked', handleSeeked);

    // Start watch session
    startSession();

    // Cleanup
    return () => {
      // Save final progress
      saveProgress();
      
      // Clear interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Remove event listeners and destroy player
      player.off('loadeddata', handleLoadedData);
      player.off('error', handleError);
      player.off('play', handlePlay);
      player.off('pause', handlePause);
      player.off('seeked', handleSeeked);
      player.destroy();
    };
  }, [lectureInfo.LectureID]);

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with Plyr's built-in controls
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
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
          <div className="text-center">
            <p className="text-lg text-destructive">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Video Path: {lectureInfo.VideoURL}
            </p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <div className="flex-1">
        <video
          ref={videoRef}
          className="h-full w-full"
          crossOrigin="anonymous"
        >
          <source src={lectureInfo.VideoURL} type="video/mp4" />
          
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
        </video>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t border-border bg-card p-4">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="default"
          onClick={onNavigatePrevious}
          disabled={!lectureInfo.HasPrevious}
          aria-label="Previous lecture (P)"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
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
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
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

import { Button } from '@/components/ui/button';
import {
    GetVideoResumePosition,
    StartLectureWatch,
    UpdateVideoProgress,
    ToggleWindowFullscreen,
} from '@/wailsjs/go/main/App';
import type { player } from '@/wailsjs/go/models';
import { formatDuration } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PlyrComponent, { type APITypes, type PlyrProps } from 'plyr-react';
import 'plyr/dist/plyr.css';

interface VideoPlayerProps {
  lectureInfo: player.LectureInfo;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
}

// Plyr options — stable reference (defined outside component to avoid
// re-creating on every render, which would cause Plyr to re-initialise).
const PLYR_OPTIONS: PlyrProps['options'] = {
  controls: [
    'play-large',
    'play',
    'rewind',
    'fast-forward',
    'progress',
    'current-time',
    'duration',
    'mute',
    'volume',
    'captions',
    'settings',
    'fullscreen',
  ],
  // We manage global keyboard shortcuts ourselves below so that navigation
  // keys (N/P) don't get swallowed by Plyr.  Plyr still handles shortcuts
  // when the player itself is focused.
  keyboard: { focused: true, global: false },
  captions: { active: true, language: 'en', update: true },
  settings: ['captions', 'speed', 'quality'],
  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
  // Rewind / fast-forward by 10 s to match existing keyboard shortcut behaviour
  seekTime: 10,
};

export function VideoPlayer({
  lectureInfo,
  onNavigateNext,
  onNavigatePrevious,
}: VideoPlayerProps) {
  const plyrRef = useRef<APITypes>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build the Plyr source descriptor from lectureInfo.
  // Plyr re-initialises whenever this object reference changes, so we
  // compute it inline — lectureInfo identity already changes per lecture.
  const plyrSource: PlyrProps['source'] = {
    type: 'video',
    sources: [{ src: lectureInfo.VideoURL }],
    ...(lectureInfo.SubtitleURL
      ? {
          tracks: [
            {
              kind: 'captions',
              label: 'English',
              srcLang: 'en',
              src: lectureInfo.SubtitleURL,
              default: true,
            },
          ],
        }
      : {}),
  };

  // Helper — safely returns the underlying HTMLVideoElement if Plyr is ready.
  // Plyr's TypeScript types don't expose a .media property, so we query the
  // container element for the <video> tag instead.
  const getVideo = (): HTMLVideoElement | null => {
    const container = plyrRef.current?.plyr?.elements?.container;
    if (!container) return null;
    const el = container.querySelector('video');
    return el instanceof HTMLVideoElement ? el : null;
  };

  // Main effect: set up event listeners, load resume position, start session.
  // Re-runs only when the lecture ID changes (same as before).
  useEffect(() => {
    // Reset state for new video
    setIsLoading(true);
    setError(null);

    console.log('[VideoPlayer] Initializing with lectureInfo:', lectureInfo);
    console.log('[VideoPlayer] Video URL:', lectureInfo.VideoURL);
    console.log('[VideoPlayer] Subtitle URL:', lectureInfo.SubtitleURL);

    // --- event handlers ---

    const handleLoadedData = () => {
      console.log('[VideoPlayer] Video loaded successfully');
      setIsLoading(false);
      void loadResumePosition();
    };

    const handleCanPlay = () => {
      console.log('[VideoPlayer] Video can play');
      setIsLoading(false);
    };

    const handleError = () => {
      const video = getVideo();
      const videoError = video?.error ?? null;
      console.error('[VideoPlayer] Video error:', videoError);
      console.error('[VideoPlayer] Video src:', video?.src);
      setIsLoading(false);
      setError(`Failed to load video: ${videoError?.message ?? 'Unknown error'}`);
    };

    const handlePlay = () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = window.setInterval(() => {
        void saveProgress();
      }, 5000);
    };

    const handlePause = () => {
      void saveProgress();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    const handleSeeked = () => {
      void saveProgress();
    };

    // --- async helpers ---

    const loadResumePosition = async () => {
      try {
        const resumeAt = await GetVideoResumePosition(lectureInfo.LectureID);
        if (resumeAt > 0) {
          const video = getVideo();
          if (video) video.currentTime = resumeAt;
        }
      } catch (err) {
        console.error('Failed to load resume position:', err);
      }
    };

    const saveProgress = async () => {
      const video = getVideo();
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

    // Plyr may not have rendered into the DOM yet on the very first tick, so
    // we poll for the <video> element to exist.
    let video: HTMLVideoElement | null = null;

    const addListeners = (el: HTMLVideoElement) => {
      el.addEventListener('loadeddata', handleLoadedData);
      el.addEventListener('canplay', handleCanPlay);
      el.addEventListener('error', handleError);
      el.addEventListener('play', handlePlay);
      el.addEventListener('pause', handlePause);
      el.addEventListener('seeked', handleSeeked);
    };

    // Plyr initialises asynchronously — poll until the <video> element exists.
    // 50ms interval × 40 retries = 2s max wait, covering slow initialisations.
    let pollAttempts = 0;
    const pollId = window.setInterval(() => {
      video = getVideo();
      if (video) {
        window.clearInterval(pollId);
        addListeners(video);
        return;
      }
      if (++pollAttempts >= 40) {
        window.clearInterval(pollId);
        console.error('[VideoPlayer] Failed to find <video> element after 2s');
      }
    }, 50);

    // Also try immediately (no need to wait 50ms if already available)
    video = getVideo();
    if (video) {
      window.clearInterval(pollId);
      addListeners(video);
    }

    // Start watch session
    void StartLectureWatch(lectureInfo.LectureID).catch((err) =>
      console.error('Failed to start watch session:', err),
    );

    return () => {
      window.clearInterval(pollId);

      void saveProgress();

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (video) {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('seeked', handleSeeked);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureInfo.LectureID]);

  // Global keyboard shortcuts (lecture navigation + player controls)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      const video = getVideo();

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (video) {
            if (video.paused) void video.play();
            else video.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (video) video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (video) video.volume = Math.min(1, video.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (video) video.volume = Math.max(0, video.volume - 0.1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          void ToggleWindowFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          if (video) video.muted = !video.muted;
          break;
        case 'n':
        case 'N':
          if (lectureInfo.HasNext && onNavigateNext) onNavigateNext();
          break;
        case 'p':
        case 'P':
          if (lectureInfo.HasPrevious && onNavigatePrevious) onNavigatePrevious();
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

      {/* Plyr video player */}
      <div className="flex-1 flex items-center justify-center bg-black plyr-container">
        <PlyrComponent
          ref={plyrRef}
          source={plyrSource}
          options={PLYR_OPTIONS}
        />
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

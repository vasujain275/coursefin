import { Button } from '@/components/ui/button';
import type { player } from '@/wailsjs/go/models';
import { useMediaReady } from '@/hooks/useMediaReady';
import { usePlayerKeyboardShortcuts } from '@/hooks/usePlayerKeyboardShortcuts';
import { useProgressSaver } from '@/hooks/useProgressSaver';
import { useResumePosition } from '@/hooks/useResumePosition';
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
  ],
  fullscreen: { enabled: false, fallback: false, iosNative: false },
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

  const { videoEl, isReady, getVideo } = useMediaReady(plyrRef, lectureInfo.LectureID);
  useResumePosition(lectureInfo.LectureID, getVideo);
  useProgressSaver(lectureInfo.LectureID, getVideo);
  usePlayerKeyboardShortcuts(
    lectureInfo,
    getVideo,
    onNavigateNext,
    onNavigatePrevious,
  );

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [lectureInfo.LectureID]);

  useEffect(() => {
    if (!videoEl) return;

    const handleReady = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      const videoError = videoEl.error ?? null;
      setIsLoading(false);
      setError(`Failed to load video: ${videoError?.message ?? 'Unknown error'}`);
    };

    if (videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      handleReady();
    }

    videoEl.addEventListener('loadeddata', handleReady);
    videoEl.addEventListener('canplay', handleReady);
    videoEl.addEventListener('error', handleError);

    return () => {
      videoEl.removeEventListener('loadeddata', handleReady);
      videoEl.removeEventListener('canplay', handleReady);
      videoEl.removeEventListener('error', handleError);
    };
  }, [videoEl]);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Loading Overlay */}
      {isLoading && !error && (
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
        {!isReady && !error && (
          <div className="pointer-events-none absolute inset-0 bg-black/20" />
        )}
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

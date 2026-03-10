import { useEffect } from 'react';
import { ToggleWindowFullscreen } from '@/wailsjs/go/main/App';

interface NavigationState {
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PlayerKeyboardShortcutOptions {
  enableMediaShortcuts?: boolean;
}

export function usePlayerKeyboardShortcuts(
  navigationState: NavigationState,
  getVideo: () => HTMLVideoElement | null,
  onNavigateNext?: () => void,
  onNavigatePrevious?: () => void,
  options?: PlayerKeyboardShortcutOptions,
) {
  const hasNext = navigationState.hasNext;
  const hasPrevious = navigationState.hasPrevious;
  const enableMediaShortcuts = options?.enableMediaShortcuts ?? true;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const video = getVideo();

      switch (e.key) {
        case ' ': {
          if (!enableMediaShortcuts) break;
          e.preventDefault();
          if (video) {
            if (video.paused) void video.play();
            else video.pause();
          }
          break;
        }
        case 'ArrowLeft': {
          if (!enableMediaShortcuts) break;
          e.preventDefault();
          if (video) video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        }
        case 'ArrowRight': {
          if (!enableMediaShortcuts) break;
          e.preventDefault();
          if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        }
        case 'ArrowUp': {
          if (!enableMediaShortcuts) break;
          e.preventDefault();
          if (video) video.volume = Math.min(1, video.volume + 0.1);
          break;
        }
        case 'ArrowDown': {
          if (!enableMediaShortcuts) break;
          e.preventDefault();
          if (video) video.volume = Math.max(0, video.volume - 0.1);
          break;
        }
        case 'f':
        case 'F': {
          if (!enableMediaShortcuts) break;
          e.preventDefault();
          void ToggleWindowFullscreen();
          break;
        }
        case 'm':
        case 'M': {
          if (!enableMediaShortcuts) break;
          e.preventDefault();
          if (video) video.muted = !video.muted;
          break;
        }
        case 'n':
        case 'N': {
          if (hasNext && onNavigateNext) onNavigateNext();
          break;
        }
        case 'p':
        case 'P': {
          if (hasPrevious && onNavigatePrevious) onNavigatePrevious();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableMediaShortcuts, getVideo, hasNext, hasPrevious, onNavigateNext, onNavigatePrevious]);
}

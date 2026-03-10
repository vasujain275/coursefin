import { useEffect } from 'react';
import { ToggleWindowFullscreen } from '@/wailsjs/go/main/App';
import type { player } from '@/wailsjs/go/models';

export function usePlayerKeyboardShortcuts(
  lectureInfo: player.LectureInfo,
  getVideo: () => HTMLVideoElement | null,
  onNavigateNext?: () => void,
  onNavigatePrevious?: () => void,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const video = getVideo();

      switch (e.key) {
        case ' ': {
          e.preventDefault();
          if (video) {
            if (video.paused) void video.play();
            else video.pause();
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (video) video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (video) video.volume = Math.min(1, video.volume + 0.1);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          if (video) video.volume = Math.max(0, video.volume - 0.1);
          break;
        }
        case 'f':
        case 'F': {
          e.preventDefault();
          void ToggleWindowFullscreen();
          break;
        }
        case 'm':
        case 'M': {
          e.preventDefault();
          if (video) video.muted = !video.muted;
          break;
        }
        case 'n':
        case 'N': {
          if (lectureInfo.HasNext && onNavigateNext) onNavigateNext();
          break;
        }
        case 'p':
        case 'P': {
          if (lectureInfo.HasPrevious && onNavigatePrevious) onNavigatePrevious();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lectureInfo, getVideo, onNavigateNext, onNavigatePrevious]);
}

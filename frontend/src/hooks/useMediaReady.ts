import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { APITypes } from 'plyr-react';

interface UseMediaReadyResult {
  videoEl: HTMLVideoElement | null;
  isReady: boolean;
  getVideo: () => HTMLVideoElement | null;
}

export function useMediaReady(
  plyrRef: RefObject<APITypes | null>,
  lectureId: number,
): UseMediaReadyResult {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  const getVideo = useCallback((): HTMLVideoElement | null => {
    const container = plyrRef.current?.plyr?.elements?.container;
    if (!container) return null;
    const el = container.querySelector('video');
    return el instanceof HTMLVideoElement ? el : null;
  }, [plyrRef]);

  useEffect(() => {
    setVideoEl(null);
    setIsReady(false);

    let pollAttempts = 0;

    const syncVideo = (): boolean => {
      const el = getVideo();
      if (!el) return false;
      setVideoEl(el);
      setIsReady(true);
      return true;
    };

    if (syncVideo()) return;

    const pollId = window.setInterval(() => {
      if (syncVideo()) {
        window.clearInterval(pollId);
        return;
      }

      if (++pollAttempts >= 40) {
        window.clearInterval(pollId);
      }
    }, 50);

    return () => {
      window.clearInterval(pollId);
    };
  }, [lectureId, getVideo]);

  return { videoEl, isReady, getVideo };
}

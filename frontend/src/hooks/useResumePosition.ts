import { useEffect } from 'react';
import { GetVideoResumePosition } from '@/wailsjs/go/main/App';

export function useResumePosition(
  lectureId: number,
  getVideo: () => HTMLVideoElement | null,
) {
  useEffect(() => {
    let cancelled = false;
    let pollAttempts = 0;

    const applyResumePosition = async () => {
      const resumeAt = await GetVideoResumePosition(lectureId).catch(() => 0);
      if (cancelled || resumeAt <= 0) return;

      const applyIfVideoReady = (): boolean => {
        const video = getVideo();
        if (!video) return false;
        video.currentTime = resumeAt;
        return true;
      };

      if (applyIfVideoReady()) return;

      const pollId = window.setInterval(() => {
        if (cancelled) {
          window.clearInterval(pollId);
          return;
        }

        if (applyIfVideoReady()) {
          window.clearInterval(pollId);
          return;
        }

        if (++pollAttempts >= 40) {
          window.clearInterval(pollId);
        }
      }, 50);
    };

    void applyResumePosition();

    return () => {
      cancelled = true;
    };
  }, [lectureId, getVideo]);
}

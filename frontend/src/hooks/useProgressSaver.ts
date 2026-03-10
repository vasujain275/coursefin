import { useEffect, useRef } from 'react';
import { StartLectureWatch, UpdateVideoProgress } from '@/wailsjs/go/main/App';

export function useProgressSaver(
  lectureId: number,
  getVideo: () => HTMLVideoElement | null,
) {
  const progressIntervalRef = useRef<number | null>(null);
  const lastSavedPositionRef = useRef<number>(-1);

  useEffect(() => {
    let video: HTMLVideoElement | null = null;
    let pollAttempts = 0;

    const clearProgressInterval = () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    const saveProgress = async () => {
      const el = getVideo();
      if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;

      const currentTime = el.currentTime;
      if (Math.abs(currentTime - lastSavedPositionRef.current) <= 1) return;

      await UpdateVideoProgress(lectureId, currentTime, el.duration).catch(() => undefined);
      lastSavedPositionRef.current = currentTime;
    };

    const handlePlay = () => {
      clearProgressInterval();
      progressIntervalRef.current = window.setInterval(() => {
        void saveProgress();
      }, 5000);
    };

    const handlePause = () => {
      void saveProgress();
      clearProgressInterval();
    };

    const handleSeeked = () => {
      void saveProgress();
    };

    const addListeners = (el: HTMLVideoElement) => {
      el.addEventListener('play', handlePlay);
      el.addEventListener('pause', handlePause);
      el.addEventListener('seeked', handleSeeked);
      video = el;
    };

    const tryAttach = (): boolean => {
      const el = getVideo();
      if (!el) return false;
      addListeners(el);
      return true;
    };

    void StartLectureWatch(lectureId).catch(() => undefined);

    if (!tryAttach()) {
      const pollId = window.setInterval(() => {
        if (tryAttach()) {
          window.clearInterval(pollId);
          return;
        }

        if (++pollAttempts >= 40) {
          window.clearInterval(pollId);
        }
      }, 50);

      return () => {
        window.clearInterval(pollId);
        void saveProgress();
        clearProgressInterval();
        lastSavedPositionRef.current = -1;
        if (video) {
          video.removeEventListener('play', handlePlay);
          video.removeEventListener('pause', handlePause);
          video.removeEventListener('seeked', handleSeeked);
        }
      };
    }

    return () => {
      void saveProgress();
      clearProgressInterval();
      lastSavedPositionRef.current = -1;
      if (video) {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('seeked', handleSeeked);
      }
    };
  }, [lectureId, getVideo]);
}

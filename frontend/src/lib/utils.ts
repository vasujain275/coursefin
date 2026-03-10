import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Lecture } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function isVideoLecture(lecture: Lecture) {
  if (lecture.lectureType === 'text') return false;
  if (lecture.lectureType === 'video') return true;
  const ext = lecture.filePath?.toLowerCase() ?? '';
  return !ext.endsWith('.html') && !ext.endsWith('.htm');
}

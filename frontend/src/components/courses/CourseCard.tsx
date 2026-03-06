import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Course } from '@/types';
import { BookOpen, CheckCircle2, ClipboardList, Clock, PlayCircle } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
}

// Format a relative time string like "2 days ago", "just now", etc.
function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  // Prefer sections-derived counts when sections are loaded (PlayerView),
  // otherwise use the aggregate progress stats from GetAllCourses.
  const totalLectures = course.sections
    ? course.sections.reduce((acc, section) => acc + section.lectures.length, 0)
    : course.totalLectures || 0;

  const completedLectures = course.sections
    ? course.sections.reduce(
        (acc, section) => acc + section.lectures.filter(l => l.isCompleted).length,
        0
      )
    : course.completedLectures ?? 0;

  // Use backend-provided progressPercent when sections aren't loaded,
  // otherwise compute from sections data.
  const progressPercent = course.sections
    ? (totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0)
    : (course.progressPercent ?? 0);

  // A course is "started" if it has any progress record at all, even if no
  // lecture has crossed the 90% completion threshold yet.
  const hasStarted = course.hasProgress || (course.lastWatchedAt != null) ||
    (course.sections != null && completedLectures > 0);

  const sectionCount = course.sections ? course.sections.length : 0;

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 border-border/50 hover:border-primary/30"
      onClick={onClick}
    >
      {/* Thumbnail/Poster */}
      <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-accent/5 relative overflow-hidden">
        {/* Placeholder Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen
            className="w-14 h-14 text-primary/20 transition-transform duration-500 group-hover:scale-110"
            strokeWidth={1.5}
          />
        </div>

        {/* Duration Badge */}
        {course.totalDuration > 0 && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-border/50 gap-1 mono text-xs">
              <Clock className="w-3 h-3" />
              {formatDuration(course.totalDuration)}
            </Badge>
          </div>
        )}

        {/* Play Overlay (on hover) */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110">
            <PlayCircle className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
          {course.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Course Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {sectionCount > 0 && (
            <div className="flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{sectionCount} sections</span>
            </div>
          )}
          {totalLectures > 0 && (
            <div className="flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{totalLectures} lectures</span>
            </div>
          )}
        </div>

        {/* Progress */}
        {hasStarted && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4 flex items-center justify-between gap-2">
        {!hasStarted ? (
          <p className="text-xs text-muted-foreground">Not started</p>
        ) : progressPercent >= 100 ? (
          <div className="flex items-center gap-1.5 text-xs text-success font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </div>
        ) : (
          <p className="text-xs text-primary font-medium">
            {completedLectures} of {totalLectures} lectures
          </p>
        )}
        {/* Last watched time */}
        {course.lastWatchedAt && hasStarted && (
          <p className="text-xs text-muted-foreground/70 text-right shrink-0">
            {formatRelativeTime(course.lastWatchedAt)}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// CourseGrid - CourseFin
// ============================================================================
// Purpose: Auto-fit grid layout for course cards
// Architecture: Responsive fluid grid with loading and empty states
// ============================================================================

import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course } from '@/types';
import { BookOpen } from 'lucide-react';
import { CourseCard } from './CourseCard';

interface CourseGridProps {
  courses: Course[];
  onCourseClick?: (course: Course) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: () => void;
  emptyActionLabel?: string;
}

export function CourseGrid({
  courses,
  onCourseClick,
  isLoading = false,
  emptyMessage = 'No courses found',
  emptyAction,
  emptyActionLabel,
}: CourseGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden border-border/50">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-10 h-10 text-primary" />}
        title="No Courses Yet"
        description={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={emptyAction}
      />
    );
  }

  // Course grid
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      {courses.map((course, index) => (
        <div
          key={course.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
        >
          <CourseCard
            course={course}
            onClick={() => onCourseClick?.(course)}
          />
        </div>
      ))}
    </div>
  );
}

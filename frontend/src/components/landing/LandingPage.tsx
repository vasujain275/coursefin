// ============================================================================
// LandingPage - CourseFin
// ============================================================================
// Purpose: Main landing page — shows course library with Refresh Library button
// Architecture: Uses ScanLibrary() Wails binding for on-demand library refresh
// ============================================================================

import { AppLayout } from '@/components/common/AppLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { CourseGrid } from '@/components/courses/CourseGrid';
import { Button } from '@/components/ui/button';
import type { Course } from '@/types';
import { useCourseStore } from '@/stores/courseStore';
import { ScanLibrary } from '@/wailsjs/go/main/App';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { GettingStartedGuide } from './GettingStartedGuide';

interface LandingPageProps {
  onCourseSelect: (courseId: number) => void;
  onSettings?: () => void;
}

export function LandingPage({ onCourseSelect, onSettings }: LandingPageProps) {
  const { courses, isLoading, error, loadCourses, refreshCourses } = useCourseStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const lowerQuery = searchQuery.toLowerCase();
    return courses.filter(course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.instructorName?.toLowerCase().includes(lowerQuery)
    );
  }, [courses, searchQuery]);

  // Load courses on mount
  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  // Scan the courses directory and import any new course folders
  const handleRefreshLibrary = async () => {
    setIsRefreshing(true);
    try {
      const result = await ScanLibrary();

      // Reload the course grid
      await refreshCourses();

      // Show a summary toast
      if (result.coursesAdded > 0) {
        toast.success('Library Refreshed', {
          description: `${result.coursesAdded} new course${result.coursesAdded !== 1 ? 's' : ''} added${result.coursesSkipped > 0 ? `, ${result.coursesSkipped} already imported` : ''}.`,
        });
      } else {
        toast.info('Library up to date', {
          description: result.coursesSkipped > 0
            ? `All ${result.coursesSkipped} course${result.coursesSkipped !== 1 ? 's' : ''} already imported.`
            : 'No course folders found in your library directory.',
        });
      }

      // Warn if some folders were skipped due to errors
      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.errors.length} folder${result.errors.length !== 1 ? 's' : ''} skipped`, {
          description: result.errors[0],
        });
      }
    } catch (err) {
      toast.error('Refresh Failed', {
        description: err instanceof Error ? err.message : 'Could not scan the library directory.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCourseClick = (course: Course) => {
    onCourseSelect(course.id);
  };

  return (
    <AppLayout
      onSearch={handleSearch}
      onSettings={onSettings}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your library...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <EmptyState
          icon={<AlertCircle className="w-10 h-10 text-destructive" />}
          title="Failed to Load Courses"
          description={error}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && courses.length === 0 && (
        <GettingStartedGuide
          onImportCourse={handleRefreshLibrary}
          onSettings={onSettings}
        />
      )}

      {/* Course Library */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                My Courses
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredCourses.length === courses.length
                  ? `${courses.length} course${courses.length !== 1 ? 's' : ''} in your library`
                  : `${filteredCourses.length} of ${courses.length} courses`}
              </p>
            </div>

            {/* Refresh Library button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleRefreshLibrary()}
              disabled={isRefreshing}
              className="gap-2 border-border/50 hover:border-primary/30 transition-colors"
              title="Scan library directory for new courses"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Scanning…' : 'Refresh Library'}
            </Button>
          </div>

          {/* Course Grid */}
          <CourseGrid
            courses={filteredCourses}
            onCourseClick={handleCourseClick}
            emptyMessage="No courses match your search"
            emptyActionLabel="Clear Search"
            emptyAction={() => setSearchQuery('')}
          />
        </div>
      )}
    </AppLayout>
  );
}

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
import { GetAllCourses, ScanLibrary } from '@/wailsjs/go/main/App';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GettingStartedGuide } from './GettingStartedGuide';

interface LandingPageProps {
  onCourseSelect: (courseId: number) => void;
}

export function LandingPage({ onCourseSelect }: LandingPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Load courses on mount
  useEffect(() => {
    void loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const allCourses = await GetAllCourses();
      setCourses(allCourses || []);
      setFilteredCourses(allCourses || []);
      setError(undefined);
    } catch (err) {
      setError('Failed to load courses');
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Scan the courses directory and import any new course folders
  const handleRefreshLibrary = async () => {
    setIsRefreshing(true);
    try {
      const result = await ScanLibrary();

      // Reload the course grid
      await loadCourses();

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
    if (!query.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.instructorName?.toLowerCase().includes(lowerQuery)
    );
    setFilteredCourses(filtered);
  };

  const handleCourseClick = (course: Course) => {
    onCourseSelect(course.id);
  };

  return (
    <AppLayout
      onSearch={handleSearch}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-muted-foreground">Loading your library...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
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
        />
      )}

      {/* Course Library */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
              <p className="text-muted-foreground mt-1">
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
              className="gap-2"
              title="Scan library directory for new courses"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isRefreshing ? 'Scanning…' : 'Refresh Library'}
            </Button>
          </div>

          {/* Course Grid */}
          <CourseGrid
            courses={filteredCourses}
            onCourseClick={handleCourseClick}
            emptyMessage="No courses match your search"
            emptyActionLabel="Clear Search"
            emptyAction={() => setFilteredCourses(courses)}
          />
        </div>
      )}
    </AppLayout>
  );
}

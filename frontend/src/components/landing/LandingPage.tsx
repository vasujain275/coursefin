// ============================================================================
// LandingPage - CourseFin
// ============================================================================
// Purpose: Main landing page after onboarding
// Architecture: Shows GettingStartedGuide or course library
// ============================================================================

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/common/AppLayout';
import { GettingStartedGuide } from './GettingStartedGuide';
import { EmptyState } from '@/components/common/EmptyState';
import { CourseGrid } from '@/components/courses/CourseGrid';
import { ImportCourseDialog } from '@/components/courses/ImportCourseDialog';
import { GetAllCourses } from '@/wailsjs/go/main/App';
import type { Course, ImportCourseResult } from '@/types';
import { toast } from 'sonner';

interface LandingPageProps {
  onCourseSelect: (courseId: number) => void;
}

export function LandingPage({ onCourseSelect }: LandingPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
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

  const handleAddCourse = () => {
    setShowImportDialog(true);
  };

  const handleImportSuccess = (result: ImportCourseResult) => {
    if (result.alreadyExists) {
      toast.info('Course Already Imported', {
        description: `"${result.title}" is already in your library.`,
      });
    } else {
      toast.success('Course Imported Successfully', {
        description: `"${result.title}" has been added to your library with ${result.totalLectures} lectures.`,
      });
    }
    
    // Reload courses
    void loadCourses();
  };

  const handleSettings = () => {
    // TODO: Implement settings dialog
    console.log('Settings clicked');
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
      onAddCourse={handleAddCourse}
      onSettings={handleSettings}
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

      {/* Empty State - Show Getting Started Guide */}
      {!isLoading && !error && courses.length === 0 && (
        <GettingStartedGuide
          onImportCourse={handleAddCourse}
          onSettings={handleSettings}
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
          </div>

          {/* Course Grid */}
          <CourseGrid
            courses={filteredCourses}
            onCourseClick={handleCourseClick}
            emptyMessage="No courses match your search"
            emptyActionLabel="Clear Search"
            emptyAction={() => {
              setFilteredCourses(courses);
              // TODO: Also clear search input in header
            }}
          />
        </div>
      )}

      {/* Import Course Dialog */}
      <ImportCourseDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={handleImportSuccess}
      />
    </AppLayout>
  );
}

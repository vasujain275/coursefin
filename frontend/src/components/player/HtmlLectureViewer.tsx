// ============================================================================
// HtmlLectureViewer - CourseFin
// ============================================================================
// Purpose: Renders HTML lecture content (text articles, quizzes)
// Architecture: Safe HTML rendering with app theme styling
// ============================================================================

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HtmlLectureViewerProps {
  lectureId: number;
  title: string;
  htmlFilePath: string;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function HtmlLectureViewer({
  lectureId,
  title,
  htmlFilePath,
  onNavigateNext,
  onNavigatePrevious,
  hasNext,
  hasPrevious,
}: HtmlLectureViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const loadHtmlContent = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        // Read the HTML file using fetch with file:// protocol
        const response = await fetch(`file://${htmlFilePath}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load HTML file: ${response.statusText}`);
        }

        const content = await response.text();
        setHtmlContent(content);
      } catch (err) {
        setError('Failed to load lecture content. Please check the file path.');
        console.error('Failed to load HTML content:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void loadHtmlContent();
  }, [htmlFilePath, lectureId]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'n':
        case 'N':
          if (hasNext && onNavigateNext) {
            onNavigateNext();
          }
          break;
        case 'p':
        case 'P':
          if (hasPrevious && onNavigatePrevious) {
            onNavigatePrevious();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrevious, onNavigateNext, onNavigatePrevious]);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">Text Lecture</p>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-muted-foreground">Loading lecture...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2 max-w-md">
              <svg className="w-12 h-12 text-destructive mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-foreground">Failed to Load Lecture</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                Path: {htmlFilePath}
              </p>
            </div>
          </div>
        )}

        {/* HTML Content */}
        {!isLoading && !error && htmlContent && (
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {/* Styled HTML content wrapper */}
              <div
                className="prose prose-slate dark:prose-invert max-w-none
                  prose-headings:text-foreground prose-headings:font-semibold
                  prose-p:text-foreground prose-p:leading-relaxed
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border
                  prose-ul:text-foreground prose-ol:text-foreground
                  prose-li:text-foreground prose-li:leading-relaxed
                  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                  prose-img:rounded-lg prose-img:border prose-img:border-border
                  prose-hr:border-border
                  prose-table:border prose-table:border-border
                  prose-th:bg-muted prose-th:text-foreground
                  prose-td:border prose-td:border-border"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t border-border bg-card px-6 py-4">
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={onNavigatePrevious}
          disabled={!hasPrevious}
          aria-label="Previous lecture (P)"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        {/* Mark as Complete Button */}
        <Button variant="default" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Mark as Complete
        </Button>

        {/* Next Button */}
        <Button
          variant="outline"
          onClick={onNavigateNext}
          disabled={!hasNext}
          aria-label="Next lecture (N)"
        >
          Next
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

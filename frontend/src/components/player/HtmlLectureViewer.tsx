// ============================================================================
// HtmlLectureViewer - CourseFin
// ============================================================================
// Purpose: Renders HTML lecture content inline via iframe srcdoc=.
// Architecture: Instead of loading via URL (which causes cross-origin errors
//   between wails:// and http://127.0.0.1), the Go backend reads the file
//   from disk and returns the content as a string. We inject it into the
//   iframe using the srcdoc= attribute so scripts/styles all work correctly.
// ============================================================================

import { Button } from '@/components/ui/button';
import { GetHtmlLectureContent } from '@/wailsjs/go/main/App';
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HtmlLectureViewerProps {
  lectureId: number;
  title: string;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function HtmlLectureViewer({
  lectureId,
  title,
  onNavigateNext,
  onNavigatePrevious,
  hasNext,
  hasPrevious,
}: HtmlLectureViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    setHtmlContent('');

    GetHtmlLectureContent(lectureId)
      .then((content) => {
        setHtmlContent(content);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [lectureId]);

  // Keyboard navigation (N = next, P = previous)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLIFrameElement
      ) return;
      if ((e.key === 'n' || e.key === 'N') && hasNext) onNavigateNext?.();
      if ((e.key === 'p' || e.key === 'P') && hasPrevious) onNavigatePrevious?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrevious, onNavigateNext, onNavigatePrevious]);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-border/40 bg-card/80 backdrop-blur-sm px-5 py-3 flex-shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 flex-shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground line-clamp-1">{title}</h2>
          <p className="text-[10px] text-muted-foreground">Article / Text Lecture</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden bg-background">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading lecture...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && htmlContent && (
          <iframe
            key={lectureId}
            srcDoc={htmlContent}
            title={title}
            className="w-full h-full border-0"
            // srcdoc= bypasses cross-origin restrictions; allow-scripts needed for quiz interactivity
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            style={{ background: 'var(--background)' }}
          />
        )}
      </div>

      {/* ── Navigation Controls ── */}
      <div className="flex items-center justify-between border-t border-border/40 bg-card/80 backdrop-blur-sm px-5 py-2.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigatePrevious}
          disabled={!hasPrevious}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <span className="text-xs text-muted-foreground hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border font-mono">P</kbd> / <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border font-mono">N</kbd> to navigate
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateNext}
          disabled={!hasNext}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

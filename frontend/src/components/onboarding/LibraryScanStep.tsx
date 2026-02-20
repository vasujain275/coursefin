// ============================================================================
// LibraryScanStep - CourseFin
// ============================================================================
// Purpose: Onboarding step that auto-scans the courses directory and imports
//          all course subfolders. Shows progress and results before finishing.
// Architecture: Calls ScanLibrary() Wails binding on mount, then shows summary.
// ============================================================================

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScanLibraryResult } from '@/types';
import { ScanLibrary } from '@/wailsjs/go/main/App';
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type ScanState = 'scanning' | 'success' | 'error';

interface LibraryScanStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function LibraryScanStep({ onComplete, onBack }: LibraryScanStepProps) {
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [result, setResult] = useState<ScanLibraryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Auto-kick off the scan as soon as we land on this step
  useEffect(() => {
    void runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScan = async () => {
    setScanState('scanning');
    setErrorMessage(undefined);
    try {
      const scanResult = await ScanLibrary();
      setResult(scanResult);
      setScanState('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setScanState('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {scanState === 'scanning' && 'Scanning Library…'}
            {scanState === 'success' && 'Library Ready!'}
            {scanState === 'error' && 'Scan Failed'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {scanState === 'scanning' && 'Importing courses from your directory. This may take a moment.'}
            {scanState === 'success' && 'Your courses have been imported and are ready to watch.'}
            {scanState === 'error' && 'Something went wrong while scanning your library.'}
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl">
              {scanState === 'scanning' && 'Importing Courses'}
              {scanState === 'success' && 'Scan Complete'}
              {scanState === 'error' && 'Error'}
            </CardTitle>
            <CardDescription>
              {scanState === 'scanning' && 'CourseFin is scanning all subfolders and importing courses…'}
              {scanState === 'success' && 'All course folders have been processed.'}
              {scanState === 'error' && 'Could not complete the library scan.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ── Scanning State ── */}
            {scanState === 'scanning' && (
              <div className="flex flex-col items-center py-10 gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-border/50" />
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scanning course folders…
                </p>
              </div>
            )}

            {/* ── Success State ── */}
            {scanState === 'success' && result && (
              <div className="space-y-5">
                {/* Big checkmark */}
                <div className="flex justify-center py-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-primary/5">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <span className="text-3xl font-bold text-primary">{result.coursesAdded}</span>
                    <span className="text-sm text-muted-foreground mt-1">
                      {result.coursesAdded === 1 ? 'Course Added' : 'Courses Added'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/30 rounded-xl border border-border/50">
                    <span className="text-3xl font-bold text-muted-foreground">{result.coursesSkipped}</span>
                    <span className="text-sm text-muted-foreground mt-1">
                      Already Imported
                    </span>
                  </div>
                </div>

                {/* Non-fatal errors list */}
                {result.errors.length > 0 && (
                  <div className="p-4 bg-warning/10 rounded-xl border border-warning/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground">
                        {result.errors.length} folder{result.errors.length !== 1 ? 's' : ''} skipped
                      </p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-0.5 pl-6 list-disc">
                      {result.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Zero courses notice */}
                {result.coursesAdded === 0 && result.coursesSkipped === 0 && (
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      No course folders were found in the selected directory. You can add courses later using the <strong>Refresh Library</strong> button.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Error State ── */}
            {scanState === 'error' && (
              <div className="space-y-5">
                <div className="flex justify-center py-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
                    <XCircle className="w-10 h-10 text-destructive" />
                  </div>
                </div>
                {errorMessage && (
                  <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20">
                    <p className="text-sm text-destructive mono">{errorMessage}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  You can try again, or go back and verify your directory selection.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-3">
            {/* Back only available when not actively scanning */}
            {scanState !== 'scanning' && (
              <Button onClick={onBack} variant="outline" className="h-11 px-6 border-border/50">
                Back
              </Button>
            )}

            {scanState === 'error' && (
              <Button onClick={() => void runScan()} className="flex-1 h-11 text-base shadow-lg shadow-primary/20">
                Retry Scan
              </Button>
            )}

            {scanState === 'success' && (
              <Button onClick={onComplete} className="flex-1 h-11 text-base shadow-lg shadow-primary/20 gap-2">
                Open Library
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground ml-2">Step 3 of 3</span>
        </div>
      </div>
    </div>
  );
}

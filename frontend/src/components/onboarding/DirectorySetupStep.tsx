// ============================================================================
// DirectorySetupStep - CourseFin
// ============================================================================
// Purpose: Onboarding step for selecting courses directory
// Architecture: Uses Wails SelectFolderDialog binding
// ============================================================================

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectFolderDialog } from '@/wailsjs/go/main/App';
import { useState } from 'react';

interface DirectorySetupStepProps {
  onNext: () => void;
  onBack: () => void;
  initialDirectory?: string;
  onDirectoryChange: (path: string) => void;
}

export function DirectorySetupStep({
  onNext,
  onBack,
  initialDirectory,
  onDirectoryChange
}: DirectorySetupStepProps) {
  const [directory, setDirectory] = useState(initialDirectory || '');
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    setError(undefined);

    try {
      const path = await SelectFolderDialog('Select Your Courses Directory');

      if (path && path.trim()) {
        setDirectory(path);
        onDirectoryChange(path);
        setError(undefined);
      }
    } catch (err) {
      setError('Failed to select directory. Please try again.');
      console.error('Directory selection error:', err);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleContinue = () => {
    if (!directory.trim()) {
      setError('Please select a directory before continuing');
      return;
    }

    onNext();
  };

  const canContinue = directory.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Choose Your Courses Folder
          </h1>
          <p className="text-lg text-muted-foreground">
            Select the folder where your downloaded courses are stored
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Courses Directory</CardTitle>
            <CardDescription>
              Select the parent folder that contains all your course folders. CourseFin will scan for courses inside this directory.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Directory Input */}
            <div className="space-y-3">
              <Label htmlFor="directory" className="text-base">
                Selected Folder
              </Label>

              <div className="flex gap-3">
                <Input
                  id="directory"
                  value={directory}
                  readOnly
                  placeholder="No folder selected..."
                  className="flex-1 h-11 text-base font-mono text-sm bg-muted"
                />

                <Button
                  onClick={handleSelectFolder}
                  disabled={isSelecting}
                  variant="outline"
                  className="h-11 px-6"
                >
                  {isSelecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Selecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                      </svg>
                      Browse
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Expected folder structure</p>
                  <p className="text-sm text-muted-foreground">
                    Select the parent folder that contains multiple course folders. Each course folder should have sections with lecture files inside.
                  </p>
                  <div className="mt-2 font-mono text-xs text-muted-foreground space-y-0.5">
                    <div>📁 courses/ <span className="text-primary">← Select this parent folder</span></div>
                    <div className="pl-4">📁 Course 1/</div>
                    <div className="pl-8">📁 1 - Section Name/</div>
                    <div className="pl-12">🎬 1. Lecture.mp4</div>
                    <div className="pl-4">📁 Course 2/</div>
                    <div className="pl-8">📁 1 - Intro/</div>
                    <div className="pl-12">🎬 1. Welcome.mp4</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-3">
            <Button
              onClick={onBack}
              variant="outline"
              className="h-11 px-6"
            >
              Back
            </Button>

            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              className="flex-1 h-11 text-base"
            >
              Continue
            </Button>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Step 2 of 3
        </p>
      </div>
    </div>
  );
}

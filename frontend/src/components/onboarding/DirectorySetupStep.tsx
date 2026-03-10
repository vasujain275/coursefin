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
import { AlertCircle, FolderOpen, Info, Loader2 } from 'lucide-react';
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
      <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
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
        <Card className="border-border/50 shadow-xl shadow-primary/5">
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
                  className="flex-1 h-11 text-sm mono bg-muted/30 border-border/50"
                />

                <Button
                  onClick={handleSelectFolder}
                  disabled={isSelecting}
                  variant="outline"
                  className="h-11 px-6 border-border/50 hover:border-primary/30"
                >
                  {isSelecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Selecting...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Browse
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Expected folder structure</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Select the parent folder that contains multiple course folders. Each course folder should have sections with lecture files inside.
                  </p>
                  <div className="mt-2 mono text-xs text-muted-foreground space-y-0.5 bg-background/50 rounded-lg p-3 border border-border/30">
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
              className="h-11 px-6 border-border/50"
            >
              Back
            </Button>

            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              className="flex-1 h-11 text-base shadow-lg shadow-primary/20"
            >
              Continue
            </Button>
          </CardFooter>
        </Card>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground ml-2">Step 2 of 3</span>
        </div>
      </div>
    </div>
  );
}

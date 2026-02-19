// ============================================================================
// OptionalImportStep - CourseFin
// ============================================================================
// Purpose: Optional onboarding step - simplified to skip for now
// Architecture: Allows user to skip and import courses later
// ============================================================================

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface OptionalImportStepProps {
  onComplete: () => void;
  onBack: () => void;
  coursesDirectory: string;
}

export function OptionalImportStep({ 
  onComplete, 
  onBack, 
}: OptionalImportStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            You're All Set!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your courses directory has been configured. You can now import courses from the main application.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Start</CardTitle>
            <CardDescription>
              You can import courses anytime using the "Add Course" button in the main application.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Info Box */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">How to import courses</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Click "Add Course" in the header</li>
                    <li>Select a course folder from your courses directory</li>
                    <li>CourseFin will automatically detect and import the course structure</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Setup Complete!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start importing and managing your course library
                </p>
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
              onClick={onComplete}
              className="flex-1 h-11 text-base"
            >
              Complete Setup
            </Button>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Step 3 of 3
        </p>
      </div>
    </div>
  );
}

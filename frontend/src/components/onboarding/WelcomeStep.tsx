// ============================================================================
// WelcomeStep - CourseFin
// ============================================================================
// Purpose: Initial onboarding welcome screen
// Architecture: Modern animated hero with feature showcase
// ============================================================================

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, BookOpen, FolderOpen, PlayCircle } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 mb-4 animate-glow-pulse">
            <BookOpen className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome to CourseFin
          </h1>

          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Your personal course library manager for locally downloaded Udemy courses
          </p>
        </div>

        {/* Features Card */}
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl">What You Can Do</CardTitle>
            <CardDescription>
              CourseFin helps you organize and learn from your downloaded courses
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {/* Feature 1 */}
              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/10 transition-colors">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Organize Your Library</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Import and manage all your downloaded courses in one place
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/10 transition-colors">
                  <PlayCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Smooth Video Playback</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Watch video lectures with subtitles, speed control, and progress tracking
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/10 transition-colors">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Track Your Progress</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Resume where you left off and see your completion status
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={onNext}
              className="w-full h-12 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              size="lg"
            >
              Get Started
            </Button>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-border" />
          <div className="w-2 h-2 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground ml-2">Step 1 of 3</span>
        </div>
      </div>
    </div>
  );
}

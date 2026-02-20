// ============================================================================
// GettingStartedGuide - CourseFin
// ============================================================================
// Purpose: Impressive welcome guide with tutorial cards
// Architecture: Hero section + action cards with modern design
// ============================================================================

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, BookOpen, Check, CloudUpload, PlayCircle, RefreshCw } from 'lucide-react';

interface GettingStartedGuideProps {
  onImportCourse?: () => void;
  onSettings?: () => void;
}

export function GettingStartedGuide({
  onImportCourse,
  onSettings
}: GettingStartedGuideProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 mb-4 animate-glow-pulse">
          <BookOpen className="w-12 h-12 text-primary" strokeWidth={1.5} />
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Welcome to CourseFin
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your personal hub for managing and learning from locally downloaded Udemy courses.
            Let's get you started.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            onClick={onImportCourse}
            size="lg"
            className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
          >
            <RefreshCw className="w-5 h-5" />
            Scan Library
          </Button>
          <Button
            onClick={onSettings}
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base border-border/50 hover:border-primary/30 transition-colors"
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Card 1: Import & Organize */}
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300">
              <CloudUpload className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Import & Organize</CardTitle>
            <CardDescription className="leading-relaxed">
              Scan your local folders to automatically import course structure, sections, and lectures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                Auto-detect course structure
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                Organize sections & lectures
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                Import multiple courses at once
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Card 2: Watch & Learn */}
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300">
              <PlayCircle className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Watch & Learn</CardTitle>
            <CardDescription className="leading-relaxed">
              Enjoy a smooth video playback experience with subtitles, speed control, and progress tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                HD video playback
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                Subtitles & captions support
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                Variable playback speed
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Card 3: Track Progress */}
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Track Progress</CardTitle>
            <CardDescription className="leading-relaxed">
              Monitor your learning journey with automatic progress tracking and resume functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                Resume where you left off
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                View completion percentage
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                Mark lectures as complete
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* How to Get Started Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center text-foreground">
          How to Get Started
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20">
                1
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Set Up Your Library
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Point CourseFin to the folder where your downloaded courses are stored. This was done during onboarding, but you can change it anytime in settings.
              </p>
            </div>
            {/* Connector Line */}
            <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20">
                2
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Scan Your Library
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Click <strong>Refresh Library</strong> in the library view to scan your courses folder and automatically import all course subfolders.
              </p>
            </div>
            {/* Connector Line */}
            <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20">
                3
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Start Learning
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse your library, select a course, and start watching. Your progress will be automatically saved so you can resume anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-8">
        <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 backdrop-blur-sm">
          <p className="text-lg font-medium text-foreground">
            Ready to start your learning journey?
          </p>
          <Button
            onClick={onImportCourse}
            size="lg"
            className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-5 h-5" />
            Scan Library
          </Button>
        </div>
      </div>
    </div>
  );
}

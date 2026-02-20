// ============================================================================
// App - CourseFin
// ============================================================================
// Purpose: Main application component with first-run detection and routing
// Architecture: Routes between onboarding and landing page
// ============================================================================

import { LandingPage } from '@/components/landing/LandingPage';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { PlayerView } from '@/components/player/PlayerView';
import { Toaster } from '@/components/ui/sonner';
import { useSettingsStore } from '@/stores/settingsStore';
import '@/style.css';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Simple navigation state
type View = 'onboarding' | 'landing' | 'player';

function App() {
  const { firstRun, isLoading, loadSettings, theme } = useSettingsStore();
  const [currentView, setCurrentView] = useState<View>('landing');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Load settings on mount
  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // Apply theme when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  // Determine initial view based on firstRun
  useEffect(() => {
    if (!isLoading) {
      setCurrentView(firstRun ? 'onboarding' : 'landing');
    }
  }, [firstRun, isLoading]);

  const handleOnboardingComplete = () => {
    setCurrentView('landing');
  };

  const handleCourseSelect = (courseId: number) => {
    setSelectedCourseId(courseId);
    setCurrentView('player');
  };

  const handleBackToLibrary = () => {
    setSelectedCourseId(null);
    setCurrentView('landing');
  };

  const handleSettings = () => {
    // TODO: Open settings dialog/panel
    console.log('Open settings');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading CourseFin...</p>
        </div>
      </div>
    );
  }

  // Render current view
  return (
    <>
      {currentView === 'onboarding' && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
      {currentView === 'landing' && (
        <LandingPage
          onCourseSelect={handleCourseSelect}
          onSettings={handleSettings}
        />
      )}
      {currentView === 'player' && selectedCourseId && (
        <PlayerView
          courseId={selectedCourseId}
          onBack={handleBackToLibrary}
        />
      )}
      <Toaster />
    </>
  );
}

export default App;

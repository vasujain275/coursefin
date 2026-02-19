// ============================================================================
// App - CourseFin
// ============================================================================
// Purpose: Main application component with first-run detection and routing
// Architecture: Routes between onboarding and landing page
// ============================================================================

import { useEffect, useState } from 'react';
import '@/style.css';
import { useSettingsStore } from '@/stores/settingsStore';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LandingPage } from '@/components/landing/LandingPage';
import { PlayerView } from '@/components/player/PlayerView';
import { Toaster } from '@/components/ui/sonner';

// Simple navigation state
type View = 'onboarding' | 'landing' | 'player';

function App() {
  const { firstRun, isLoading, loadSettings, setTheme, theme } = useSettingsStore();
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
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
        <LandingPage onCourseSelect={handleCourseSelect} />
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

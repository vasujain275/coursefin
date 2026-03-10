// ============================================================================
// App - CourseFin
// ============================================================================
// Purpose: Main application component with first-run detection and routing
// Architecture: Routes between onboarding and landing page
// ============================================================================

import { LandingPage } from '@/components/landing/LandingPage';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { PlayerView } from '@/components/player/PlayerView';
import { SettingsDialog } from '@/components/settings';
import { Toaster } from '@/components/ui/sonner';
import { applyTheme } from '@/lib/themeUtils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useShallow } from 'zustand/react/shallow';
import '@/style.css';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Simple navigation state
type View = 'onboarding' | 'landing' | 'player';

function App() {
  const { firstRun, isLoading, loadSettings, theme } = useSettingsStore(
    useShallow(state => ({
      firstRun: state.firstRun,
      isLoading: state.isLoading,
      loadSettings: state.loadSettings,
      theme: state.theme,
    }))
  );
  const [currentView, setCurrentView] = useState<View>('landing');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedView, setDisplayedView] = useState<View>('landing');

  // Load settings on mount
  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Determine initial view based on firstRun
  useEffect(() => {
    if (!isLoading) {
      const initialView = firstRun ? 'onboarding' : 'landing';
      setCurrentView(initialView);
      setDisplayedView(initialView);
    }
  }, [firstRun, isLoading]);

  // Handle smooth view transitions
  useEffect(() => {
    if (currentView !== displayedView) {
      setIsTransitioning(true);
      const t = setTimeout(() => {
        setDisplayedView(currentView);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [currentView, displayedView]);

  const handleOnboardingComplete = () => {
    setCurrentView('landing');
  };

  const handleCourseSelect = (courseId: number) => {
    setSelectedCourseId(courseId);
    setCurrentView('player');
  };

  const handleBackToLibrary = () => {
    // Do not clear selectedCourseId immediately so the player view can fade out gracefully
    setCurrentView('landing');
  };

  const handleSettings = () => {
    setSettingsOpen(true);
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
      <div
        style={{
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 150ms ease-in-out',
        }}
        className="min-h-screen w-full"
      >
        {displayedView === 'onboarding' && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        )}
        {displayedView === 'landing' && (
          <LandingPage
            onCourseSelect={handleCourseSelect}
            onSettings={handleSettings}
          />
        )}
        {displayedView === 'player' && selectedCourseId && (
          <PlayerView
            courseId={selectedCourseId}
            onBack={handleBackToLibrary}
          />
        )}
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster />
    </>
  );
}

export default App;

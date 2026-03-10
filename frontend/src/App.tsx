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
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster />
    </>
  );
}

export default App;

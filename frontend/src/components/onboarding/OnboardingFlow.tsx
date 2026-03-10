// ============================================================================
// OnboardingFlow - CourseFin
// ============================================================================
// Purpose: Orchestrates the 3-step onboarding process
// Steps: 0 = Welcome, 1 = Directory Setup, 2 = Library Scan & Results
// Architecture: Manages step transitions and state persistence
// ============================================================================

import { useOnboardingStore } from '@/stores/onboardingStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useShallow } from 'zustand/react/shallow';
import { DirectorySetupStep } from './DirectorySetupStep';
import { LibraryScanStep } from './LibraryScanStep';
import { WelcomeStep } from './WelcomeStep';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const {
    step,
    coursesDirectory,
    nextStep,
    previousStep,
    setCoursesDirectory,
    completeStep,
  } = useOnboardingStore();

  const { setCoursesDirectory: persistCoursesDirectory, completeOnboarding } = useSettingsStore(
    useShallow(state => ({
      setCoursesDirectory: state.setCoursesDirectory,
      completeOnboarding: state.completeOnboarding,
    }))
  );

  const handleDirectoryChange = async (path: string) => {
    setCoursesDirectory(path);
    await persistCoursesDirectory(path);
  };

  const handleDirectoryNext = async () => {
    completeStep(1);
    // Move to the library scan step — scan happens there
    nextStep();
  };

  const handleScanComplete = async () => {
    // Mark onboarding as finished AFTER the scan
    await completeOnboarding();
    onComplete();
  };

  switch (step) {
    case 0:
      return (
        <WelcomeStep
          onNext={() => {
            completeStep(0);
            nextStep();
          }}
        />
      );

    case 1:
      return (
        <DirectorySetupStep
          onNext={handleDirectoryNext}
          onBack={previousStep}
          initialDirectory={coursesDirectory}
          onDirectoryChange={handleDirectoryChange}
        />
      );

    case 2:
      return (
        <LibraryScanStep
          onComplete={handleScanComplete}
          onBack={previousStep}
        />
      );

    default:
      return (
        <WelcomeStep
          onNext={() => {
            completeStep(0);
            nextStep();
          }}
        />
      );
  }
}

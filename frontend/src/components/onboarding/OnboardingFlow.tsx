// ============================================================================
// OnboardingFlow - CourseFin
// ============================================================================
// Purpose: Orchestrates multi-step onboarding process
// Architecture: Manages step transitions and state persistence
// ============================================================================

import { useOnboardingStore } from '@/stores/onboardingStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { WelcomeStep } from './WelcomeStep';
import { DirectorySetupStep } from './DirectorySetupStep';

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

  const { setCoursesDirectory: persistCoursesDirectory, completeOnboarding } = useSettingsStore();

  const handleDirectoryChange = async (path: string) => {
    setCoursesDirectory(path);
    await persistCoursesDirectory(path);
  };

  const handleDirectoryNext = async () => {
    completeStep(1);
    
    // Complete onboarding immediately after directory setup
    await completeOnboarding();
    
    // Notify parent
    onComplete();
  };

  // Render current step
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

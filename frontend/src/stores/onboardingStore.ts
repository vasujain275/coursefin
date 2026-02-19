// ============================================================================
// Onboarding Store - CourseFin
// ============================================================================
// Purpose: Manage onboarding flow state
// Pattern: Zustand store for multi-step onboarding process
// ============================================================================

import { create } from 'zustand';
import type { OnboardingState } from '@/types';

interface OnboardingStore extends OnboardingState {
  // Actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  setCoursesDirectory: (path: string) => void;
  completeStep: (step: number) => void;
  reset: () => void;
}

const TOTAL_STEPS = 3; // Welcome, Directory Setup, Optional Import

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  // Initial state
  step: 0,
  totalSteps: TOTAL_STEPS,
  coursesDirectory: undefined,
  completedSteps: [],
  
  // Move to next step
  nextStep: () => set((state) => ({
    step: Math.min(state.step + 1, state.totalSteps - 1),
  })),
  
  // Move to previous step
  previousStep: () => set((state) => ({
    step: Math.max(state.step - 1, 0),
  })),
  
  // Go to specific step
  goToStep: (step) => set((state) => ({
    step: Math.max(0, Math.min(step, state.totalSteps - 1)),
  })),
  
  // Set courses directory
  setCoursesDirectory: (path) => set({ coursesDirectory: path }),
  
  // Mark step as completed
  completeStep: (step) => set((state) => ({
    completedSteps: state.completedSteps.includes(step)
      ? state.completedSteps
      : [...state.completedSteps, step],
  })),
  
  // Reset onboarding state
  reset: () => set({
    step: 0,
    coursesDirectory: undefined,
    completedSteps: [],
  }),
}));

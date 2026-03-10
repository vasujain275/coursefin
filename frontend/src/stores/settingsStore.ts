// ============================================================================
// Settings Store - CourseFin
// ============================================================================
// Purpose: Global state management for application settings
// Pattern: Zustand store with Wails backend integration
// ============================================================================

import type { AppSettings } from '@/types';
import { applyTheme } from '@/lib/themeUtils';
import { create } from 'zustand';

interface SettingsState extends AppSettings {
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  setCoursesDirectory: (path: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  firstRun: true,
  coursesDirectory: undefined,
  theme: 'dark',
  defaultPlaybackSpeed: 1.0,
  autoMarkCompleteThreshold: 0.9,
  subtitleLanguagePreference: 'en_US,en',
  autoPlayNext: true,
  resumePrompt: true,
  thumbnailCacheEnabled: true,
  scanOnStartup: false,
  isLoading: false,
  error: null,

  // Load all settings from backend
  loadSettings: async () => {
    set({ isLoading: true, error: null });

    try {
      // Import Wails bindings dynamically to avoid build-time issues
      const { GetAppSettings, IsFirstRun } = await import('@/wailsjs/go/main/App');

      const [settingsMap, firstRun] = await Promise.all([
        GetAppSettings(),
        IsFirstRun()
      ]);

      set({
        firstRun,
        coursesDirectory: settingsMap.courses_directory,
        theme: (settingsMap.theme as 'light' | 'dark' | 'system') || 'system',
        defaultPlaybackSpeed: parseFloat(settingsMap.default_playback_speed || '1.0'),
        autoMarkCompleteThreshold: parseFloat(settingsMap.auto_mark_complete_threshold || '0.9'),
        subtitleLanguagePreference: settingsMap.subtitle_language_preference || 'en_US,en',
        autoPlayNext: settingsMap.auto_play_next === 'true',
        resumePrompt: settingsMap.resume_prompt === 'true',
        thumbnailCacheEnabled: settingsMap.thumbnail_cache_enabled === 'true',
        scanOnStartup: settingsMap.scan_on_startup === 'true',
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load settings',
        isLoading: false
      });
    }
  },

  // Update a single setting
  updateSetting: async (key, value) => {
    try {
      const { SetSettingValue } = await import('@/wailsjs/go/main/App');

      // Convert the key to snake_case for backend
      const backendKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      const backendValue = String(value);

      await SetSettingValue(backendKey, backendValue);

      // Update local state
      set({ [key]: value });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update setting' });
    }
  },

  // Set courses directory
  setCoursesDirectory: async (path) => {
    try {
      const { SetCoursesDirectory } = await import('@/wailsjs/go/main/App');
      await SetCoursesDirectory(path);
      set({ coursesDirectory: path });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to set courses directory' });
    }
  },

  // Set theme
  setTheme: async (theme) => {
    try {
      const { SetTheme } = await import('@/wailsjs/go/main/App');
      await SetTheme(theme);
      set({ theme });
      applyTheme(theme);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to set theme' });
    }
  },

  // Complete onboarding
  completeOnboarding: async () => {
    try {
      const { CompleteOnboarding } = await import('@/wailsjs/go/main/App');
      await CompleteOnboarding();
      set({ firstRun: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to complete onboarding' });
    }
  },

  // Reset all settings to defaults (preserves courses directory)
  resetToDefaults: async () => {
    try {
      // Reset to default values
      const defaults = {
        theme: 'dark' as const,
        defaultPlaybackSpeed: 1.0,
        autoMarkCompleteThreshold: 0.9,
        subtitleLanguagePreference: 'en_US,en',
        autoPlayNext: true,
        resumePrompt: true,
        thumbnailCacheEnabled: true,
        scanOnStartup: false,
      };

      // Update each setting via backend
      const { SetSettingValue } = await import('@/wailsjs/go/main/App');
      
      await Promise.all([
        SetSettingValue('theme', defaults.theme),
        SetSettingValue('default_playback_speed', String(defaults.defaultPlaybackSpeed)),
        SetSettingValue('auto_mark_complete_threshold', String(defaults.autoMarkCompleteThreshold)),
        SetSettingValue('subtitle_language_preference', defaults.subtitleLanguagePreference),
        SetSettingValue('auto_play_next', String(defaults.autoPlayNext)),
        SetSettingValue('resume_prompt', String(defaults.resumePrompt)),
        SetSettingValue('thumbnail_cache_enabled', String(defaults.thumbnailCacheEnabled)),
        SetSettingValue('scan_on_startup', String(defaults.scanOnStartup)),
      ]);
      
      // Update local state
      set(defaults);
      
      // Apply theme
      applyTheme('dark');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reset settings' });
      throw error;
    }
  },
}));

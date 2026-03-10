// ============================================================================
// Theme Utilities - CourseFin
// ============================================================================
// Purpose: Consolidated theme application logic with system theme support
// Architecture: Single source of truth for DOM theme class management
// ============================================================================

type Theme = 'light' | 'dark' | 'system';

/**
 * Media query listener reference for cleanup.
 * Stored at module level so we can remove the old listener when theme changes.
 */
let systemThemeMediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Apply theme to document root element.
 * Handles dark class toggle and system theme media query listener setup.
 *
 * @param theme - 'light', 'dark', or 'system'
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Clean up old system theme listener if it exists
  if (systemThemeMediaQueryListener) {
    mediaQuery.removeEventListener('change', systemThemeMediaQueryListener);
    systemThemeMediaQueryListener = null;
  }

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System theme: apply current system preference and listen for changes
    const prefersDark = mediaQuery.matches;
    root.classList.toggle('dark', prefersDark);

    // Add listener for system theme changes
    systemThemeMediaQueryListener = (e: MediaQueryListEvent) => {
      root.classList.toggle('dark', e.matches);
    };
    mediaQuery.addEventListener('change', systemThemeMediaQueryListener);
  }
}

/**
 * Check if system prefers dark mode.
 * Used for initial system theme detection.
 */
export function getSystemThemePreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

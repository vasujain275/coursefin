// ============================================================================
// AppLayout - CourseFin
// ============================================================================
// Purpose: Main application layout wrapper (full-width, desktop-optimized)
// Architecture: Header + Content area with smooth transitions
// ============================================================================

import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  onSettings?: () => void;
  onSearch?: (query: string) => void;
}

export function AppLayout({ children, onSettings, onSearch }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header
        onSettings={onSettings}
        onSearch={onSearch}
      />
      <main className="w-full px-6 lg:px-10 xl:px-16 py-6 lg:py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}

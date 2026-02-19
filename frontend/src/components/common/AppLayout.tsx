// ============================================================================
// AppLayout - CourseFin
// ============================================================================
// Purpose: Main application layout wrapper
// Architecture: Header + Content area with proper spacing
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
      <main className="container px-6 py-8">
        {children}
      </main>
    </div>
  );
}

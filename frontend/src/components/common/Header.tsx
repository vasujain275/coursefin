// ============================================================================
// Header - CourseFin
// ============================================================================
// Purpose: Main navigation header component (full-width)
// Architecture: Logo + Search + Settings dropdown with semantic colors
// ============================================================================

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { BookOpen, HelpCircle, Info, Search, Settings } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface HeaderProps {
  onSettings?: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ onSettings, onSearch }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer for debounced search
    timerRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 wails-drag">
      <div className="flex h-14 items-center gap-4 px-6 w-full">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-lg shadow-primary/20">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            CourseFin
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-auto">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
            <Input
              type="search"
              placeholder="Search courses..."
              value={searchValue}
              onChange={handleSearch}
              className="pl-9 h-9 bg-muted/30 border-border/50 transition-all focus:bg-muted/50 focus:border-primary/50 wails-no-drag"
              aria-label="Search courses"
            />
          </div>
        </div>

        {/* Settings Menu */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors wails-no-drag"
                aria-label="Settings and options"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                Options
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Info className="w-4 h-4 mr-2" />
                About CourseFin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

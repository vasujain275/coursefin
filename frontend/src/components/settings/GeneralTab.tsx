// ============================================================================
// GeneralTab - CourseFin Settings
// ============================================================================
// Purpose: General settings (courses directory, theme, scan options)
// Architecture: Real-time saving with Wails backend integration
// ============================================================================

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/stores/settingsStore';
import { useShallow } from 'zustand/react/shallow';
import { SelectFolderDialog } from '@/wailsjs/go/main/App';
import { FolderOpen, Monitor, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

export function GeneralTab() {
  const {
    coursesDirectory,
    theme,
    scanOnStartup,
    setCoursesDirectory,
    setTheme,
    updateSetting,
  } = useSettingsStore(useShallow(state => ({
    coursesDirectory: state.coursesDirectory,
    theme: state.theme,
    scanOnStartup: state.scanOnStartup,
    setCoursesDirectory: state.setCoursesDirectory,
    setTheme: state.setTheme,
    updateSetting: state.updateSetting,
  })));

  const handleBrowseDirectory = async () => {
    try {
      const selectedPath = await SelectFolderDialog(coursesDirectory || '');
      if (selectedPath) {
        await setCoursesDirectory(selectedPath);
        toast.success('Courses directory updated', {
          description: 'Your library directory has been changed.',
        });
      }
    } catch (error) {
      toast.error('Failed to select directory', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      await setTheme(newTheme);
      toast.success('Theme updated', {
        description: `Switched to ${newTheme} theme`,
      });
    } catch (error) {
      toast.error('Failed to change theme', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleScanOnStartupToggle = async (checked: boolean) => {
    try {
      await updateSetting('scanOnStartup', checked);
      toast.success(checked ? 'Auto-scan enabled' : 'Auto-scan disabled', {
        description: checked 
          ? 'Library will scan for new courses on startup' 
          : 'Library will not auto-scan on startup',
      });
    } catch (error) {
      toast.error('Failed to update setting', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Courses Directory Section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Courses Library</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Directory where your course folders are stored
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="courses-dir">Library Directory</Label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-md border border-input bg-muted/30 text-sm text-foreground truncate">
              {coursesDirectory || 'No directory selected'}
            </div>
            <Button
              variant="outline"
              onClick={() => void handleBrowseDirectory()}
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              Browse
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            All course folders in this directory will be imported into your library
          </p>
        </div>
      </section>

      {/* Theme Section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the look and feel of CourseFin
          </p>
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {/* Light Theme */}
            <button
              onClick={() => void handleThemeChange('light')}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                ${theme === 'light' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 bg-card'
                }
              `}
            >
              <Sun className={`h-5 w-5 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${theme === 'light' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Light
              </span>
            </button>

            {/* Dark Theme */}
            <button
              onClick={() => void handleThemeChange('dark')}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                ${theme === 'dark' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 bg-card'
                }
              `}
            >
              <Moon className={`h-5 w-5 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Dark
              </span>
            </button>

            {/* System Theme */}
            <button
              onClick={() => void handleThemeChange('system')}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                ${theme === 'system' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 bg-card'
                }
              `}
            >
              <Monitor className={`h-5 w-5 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${theme === 'system' ? 'text-foreground' : 'text-muted-foreground'}`}>
                System
              </span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose a theme or sync with your system preferences
          </p>
        </div>
      </section>

      {/* Library Management Section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Library Management</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Control how your library is maintained
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="scan-startup" className="text-base font-medium cursor-pointer">
              Scan on Startup
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically scan for new courses when the app starts
            </p>
          </div>
          <Switch
            id="scan-startup"
            checked={scanOnStartup}
            onCheckedChange={(checked) => void handleScanOnStartupToggle(checked)}
          />
        </div>
      </section>
    </div>
  );
}

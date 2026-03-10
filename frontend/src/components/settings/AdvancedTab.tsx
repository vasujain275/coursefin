// ============================================================================
// AdvancedTab - CourseFin Settings
// ============================================================================
// Purpose: Advanced settings (subtitle prefs, cache, about, reset)
// Architecture: Real-time saving with reset functionality
// ============================================================================

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/stores/settingsStore';
import { useShallow } from 'zustand/react/shallow';
import { Subtitles, Database, Info, RotateCcw, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function AdvancedTab() {
  const {
    subtitleLanguagePreference,
    thumbnailCacheEnabled,
    updateSetting,
    resetToDefaults,
  } = useSettingsStore(useShallow(state => ({
    subtitleLanguagePreference: state.subtitleLanguagePreference,
    thumbnailCacheEnabled: state.thumbnailCacheEnabled,
    updateSetting: state.updateSetting,
    resetToDefaults: state.resetToDefaults,
  })));

  const [subtitlePref, setSubtitlePref] = useState(subtitleLanguagePreference);

  const handleSubtitlePrefChange = async (value: string) => {
    setSubtitlePref(value);
    try {
      await updateSetting('subtitleLanguagePreference', value);
    } catch (error) {
      toast.error('Failed to update subtitle preference', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleThumbnailCacheToggle = async (checked: boolean) => {
    try {
      await updateSetting('thumbnailCacheEnabled', checked);
      toast.success(checked ? 'Thumbnail cache enabled' : 'Thumbnail cache disabled', {
        description: checked
          ? 'Course thumbnails will be cached for faster loading'
          : 'Thumbnails will be loaded from source each time',
      });
    } catch (error) {
      toast.error('Failed to update cache setting', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleResetToDefaults = async () => {
    try {
      await resetToDefaults();
      setSubtitlePref('en_US,en');
      toast.success('Settings reset to defaults', {
        description: 'All settings have been restored to their default values',
      });
    } catch (error) {
      toast.error('Failed to reset settings', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Subtitle Preferences Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Subtitles className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Subtitle Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Configure subtitle language preferences
            </p>
          </div>
        </div>

        <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
          <div className="space-y-2">
            <Label htmlFor="subtitle-lang" className="text-base font-medium">
              Preferred Languages
            </Label>
            <Input
              id="subtitle-lang"
              type="text"
              value={subtitlePref}
              onChange={(e) => void handleSubtitlePrefChange(e.target.value)}
              placeholder="en_US,en"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of language codes (e.g., en_US,en,es)
            </p>
          </div>
        </div>
      </section>

      {/* Cache Management Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Cache Management</h3>
            <p className="text-sm text-muted-foreground">
              Control how data is cached for performance
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="thumbnail-cache" className="text-base font-medium cursor-pointer">
              Enable Thumbnail Cache
            </Label>
            <p className="text-sm text-muted-foreground">
              Store course thumbnails locally for faster loading
            </p>
          </div>
          <Switch
            id="thumbnail-cache"
            checked={thumbnailCacheEnabled}
            onCheckedChange={(checked) => void handleThumbnailCacheToggle(checked)}
          />
        </div>
      </section>

      <Separator />

      {/* About Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">About CourseFin</h3>
            <p className="text-sm text-muted-foreground">
              Application information
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary shadow-lg shadow-primary/20">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-foreground">CourseFin</h4>
              <p className="text-sm text-muted-foreground">
                Desktop Course Library Manager
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono font-medium text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-mono font-medium text-foreground">Desktop (Wails)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-mono font-medium text-foreground">React + Go</span>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-muted-foreground text-center">
            Built with ❤️ for better learning experiences
          </p>
        </div>
      </section>

      <Separator />

      {/* Reset Settings Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Reset Settings</h3>
            <p className="text-sm text-muted-foreground">
              Restore all settings to their default values
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5 space-y-3">
          <p className="text-sm text-foreground">
            This will reset all your preferences, including theme, playback settings, and advanced options. 
            Your courses directory will be preserved.
          </p>
          <Button
            variant="destructive"
            onClick={() => void handleResetToDefaults()}
            className="w-full gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default Settings
          </Button>
        </div>
      </section>
    </div>
  );
}

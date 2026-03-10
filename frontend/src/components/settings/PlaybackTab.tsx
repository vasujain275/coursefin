// ============================================================================
// PlaybackTab - CourseFin Settings
// ============================================================================
// Purpose: Playback preferences (speed, auto-complete, auto-play, resume)
// Architecture: Real-time saving with visual feedback
// ============================================================================

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/stores/settingsStore';
import { useShallow } from 'zustand/react/shallow';
import { Play, FastForward, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function PlaybackTab() {
  const {
    defaultPlaybackSpeed,
    autoMarkCompleteThreshold,
    autoPlayNext,
    resumePrompt,
    updateSetting,
  } = useSettingsStore(useShallow(state => ({
    defaultPlaybackSpeed: state.defaultPlaybackSpeed,
    autoMarkCompleteThreshold: state.autoMarkCompleteThreshold,
    autoPlayNext: state.autoPlayNext,
    resumePrompt: state.resumePrompt,
    updateSetting: state.updateSetting,
  })));

  const handlePlaybackSpeedChange = async (value: number[]) => {
    try {
      await updateSetting('defaultPlaybackSpeed', value[0]);
    } catch (error) {
      toast.error('Failed to update playback speed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleCompleteThresholdChange = async (value: number[]) => {
    try {
      await updateSetting('autoMarkCompleteThreshold', value[0] / 100);
    } catch (error) {
      toast.error('Failed to update completion threshold', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleAutoPlayNextToggle = async (checked: boolean) => {
    try {
      await updateSetting('autoPlayNext', checked);
      toast.success(checked ? 'Auto-play enabled' : 'Auto-play disabled', {
        description: checked
          ? 'Next lecture will play automatically'
          : 'Playback will stop after each lecture',
      });
    } catch (error) {
      toast.error('Failed to update auto-play setting', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleResumePromptToggle = async (checked: boolean) => {
    try {
      await updateSetting('resumePrompt', checked);
      toast.success(checked ? 'Resume prompt enabled' : 'Resume prompt disabled', {
        description: checked
          ? 'You will be asked to resume from last position'
          : 'Videos will start from the beginning',
      });
    } catch (error) {
      toast.error('Failed to update resume setting', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const playbackSpeedDisplay = defaultPlaybackSpeed.toFixed(2) + 'x';
  const completeThresholdPercent = Math.round(autoMarkCompleteThreshold * 100);

  return (
    <div className="space-y-8">
      {/* Playback Speed Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Playback Speed</h3>
            <p className="text-sm text-muted-foreground">
              Default video playback speed for all lectures
            </p>
          </div>
        </div>

        <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <Label htmlFor="playback-speed" className="text-base font-medium">
              Speed
            </Label>
            <span className="text-2xl font-bold text-primary mono">
              {playbackSpeedDisplay}
            </span>
          </div>
          
          <Slider
            id="playback-speed"
            min={0.25}
            max={2}
            step={0.25}
            value={[defaultPlaybackSpeed]}
            onValueChange={(value) => void handlePlaybackSpeedChange(value)}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground mono">
            <span>0.25x</span>
            <span>0.5x</span>
            <span>1.0x</span>
            <span>1.5x</span>
            <span>2.0x</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            This speed will be applied when starting a new lecture. You can adjust it during playback.
          </p>
        </div>
      </section>

      {/* Auto-Complete Threshold Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Completion Settings</h3>
            <p className="text-sm text-muted-foreground">
              When lectures should be marked as complete
            </p>
          </div>
        </div>

        <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <Label htmlFor="complete-threshold" className="text-base font-medium">
              Auto-Complete Threshold
            </Label>
            <span className="text-2xl font-bold text-primary mono">
              {completeThresholdPercent}%
            </span>
          </div>
          
          <Slider
            id="complete-threshold"
            min={80}
            max={100}
            step={5}
            value={[completeThresholdPercent]}
            onValueChange={(value) => void handleCompleteThresholdChange(value)}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground mono">
            <span>80%</span>
            <span>85%</span>
            <span>90%</span>
            <span>95%</span>
            <span>100%</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Lectures will be marked complete when you watch this percentage of the video
          </p>
        </div>
      </section>

      {/* Auto-Play Next Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FastForward className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Continuous Playback</h3>
            <p className="text-sm text-muted-foreground">
              Control playback flow between lectures
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="auto-play-next" className="text-base font-medium cursor-pointer">
              Auto-Play Next Lecture
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically play the next lecture when current one finishes
            </p>
          </div>
          <Switch
            id="auto-play-next"
            checked={autoPlayNext}
            onCheckedChange={(checked) => void handleAutoPlayNextToggle(checked)}
          />
        </div>
      </section>

      {/* Resume Prompt Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Resume Behavior</h3>
            <p className="text-sm text-muted-foreground">
              How partially watched lectures should behave
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="resume-prompt" className="text-base font-medium cursor-pointer">
              Show Resume Prompt
            </Label>
            <p className="text-sm text-muted-foreground">
              Ask to resume from last position for partially watched lectures
            </p>
          </div>
          <Switch
            id="resume-prompt"
            checked={resumePrompt}
            onCheckedChange={(checked) => void handleResumePromptToggle(checked)}
          />
        </div>
      </section>
    </div>
  );
}

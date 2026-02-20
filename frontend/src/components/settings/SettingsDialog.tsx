// ============================================================================
// SettingsDialog - CourseFin
// ============================================================================
// Purpose: Professional tabbed settings dialog for managing app preferences
// Architecture: Real-time saving to backend via settingsStore
// ============================================================================

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Gauge, Wrench } from 'lucide-react';
import { GeneralTab } from './GeneralTab';
import { PlaybackTab } from './PlaybackTab';
import { AdvancedTab } from './AdvancedTab';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your CourseFin preferences and configuration
          </DialogDescription>
        </DialogHeader>

        {/* Tabbed Content - Scrollable */}
        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          {/* Tab Navigation - Fixed */}
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6 h-12 shrink-0">
            <TabsTrigger 
              value="general" 
              className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="playback" 
              className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Gauge className="h-4 w-4" />
              Playback
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Wrench className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Tab Content Panels - Scrollable Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-6 py-6">
              <TabsContent value="general" className="mt-0">
                <GeneralTab />
              </TabsContent>
              
              <TabsContent value="playback" className="mt-0">
                <PlaybackTab />
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-0">
                <AdvancedTab />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

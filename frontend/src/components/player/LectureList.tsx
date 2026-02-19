// ============================================================================
// LectureList - CourseFin
// ============================================================================
// Purpose: Sidebar showing all sections and lectures for navigation
// Architecture: Expandable sections with lecture progress indicators
// ============================================================================

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Section, Lecture } from '@/types';

interface LectureListProps {
  sections: Section[];
  currentLectureId?: number;
  onLectureSelect: (lecture: Lecture) => void;
  onClose?: () => void;
}

export function LectureList({
  sections,
  currentLectureId,
  onLectureSelect,
  onClose,
}: LectureListProps) {
  // Find which section contains the current lecture
  const currentSectionIndex = sections.findIndex(section =>
    section.lectures.some(lecture => lecture.id === currentLectureId)
  );

  // Default to opening the current section
  const [openSections, setOpenSections] = useState<string[]>(
    currentSectionIndex >= 0 ? [`section-${currentSectionIndex}`] : ['section-0']
  );

  const getLectureIcon = (lecture: Lecture) => {
    // Determine icon based on file type
    const isVideo = lecture.filePath.toLowerCase().endsWith('.mp4');
    const isHtml = lecture.filePath.toLowerCase().endsWith('.html');

    if (isVideo) {
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    if (isHtml) {
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Course Content</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>

      {/* Sections List */}
      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="w-full"
        >
          {sections.map((section, sectionIndex) => {
            const completedCount = section.lectures.filter(l => l.isCompleted).length;
            const totalCount = section.lectures.length;
            const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            return (
              <AccordionItem
                key={section.id}
                value={`section-${sectionIndex}`}
                className="border-b border-border"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-accent/50 text-left">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {section.orderIndex}. {section.title}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {completedCount}/{totalCount}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-0 py-0">
                  <div className="space-y-0.5 py-1">
                    {section.lectures.map((lecture) => {
                      const isActive = lecture.id === currentLectureId;

                      return (
                        <button
                          key={lecture.id}
                          onClick={() => onLectureSelect(lecture)}
                          className={`
                            w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
                            hover:bg-accent/50
                            ${isActive ? 'bg-primary/10 border-l-2 border-primary' : ''}
                          `}
                        >
                          {/* Icon */}
                          <div className={`mt-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            {getLectureIcon(lecture)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className={`text-sm line-clamp-2 ${isActive ? 'font-medium text-primary' : 'text-foreground'}`}>
                              {lecture.orderIndex}. {lecture.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {lecture.duration > 0 && (
                                <span className="font-mono">{formatDuration(lecture.duration)}</span>
                              )}
                              {lecture.isCompleted && (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="border-t border-border px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </span>
          <span>
            {sections.reduce((acc, s) => acc + s.lectures.length, 0)} lectures
          </span>
        </div>
      </div>
    </div>
  );
}

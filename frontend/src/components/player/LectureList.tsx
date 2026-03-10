// ============================================================================
// LectureList - CourseFin
// ============================================================================
// Purpose: Sidebar showing all course sections and lecture items
// Architecture: shadcn Accordion customized to remove underline on hover.
//   The built-in AccordionTrigger applies `hover:underline` to its inner span.
//   We override it with `[&>span:last-child]:no-underline` and add our own
//   custom trigger content so we get full design control.
// ============================================================================

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatDuration } from '@/lib/utils';
import type { Lecture, SectionWithLectures } from '@/types';
import { Check, File, FileText, PlayCircle, X } from 'lucide-react';

interface LectureListProps {
  sections: SectionWithLectures[];
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

  const defaultOpen = currentSectionIndex >= 0
    ? [`section-${currentSectionIndex}`]
    : ['section-0'];

  const getLectureIcon = (lecture: Lecture, isActive: boolean) => {
    const ext = lecture.filePath?.toLowerCase() ?? '';
    const cls = cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground');

    if (lecture.lectureType === 'text' || ext.endsWith('.html')) {
      return <FileText className={cls} />;
    }
    if (ext.endsWith('.mp4') || ext.endsWith('.mkv') || ext.endsWith('.webm')) {
      return <PlayCircle className={cls} />;
    }
    return <File className={cls} />;
  };

  const totalLectures = sections.reduce((acc, s) => acc + s.lectures.length, 0);

  return (
    <div className="flex flex-col h-full bg-card/50">
      {/* ── Sidebar Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Course Content</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {sections.length} sections · {totalLectures} lectures
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Close sidebar"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* ── Sections ── */}
      <ScrollArea className="flex-1 scrollbar-thin">
        <Accordion
          type="multiple"
          defaultValue={defaultOpen}
          className="w-full"
        >
          {sections.map((section, sectionIndex) => {
            const completedCount = section.lectures.filter(l => l.isCompleted).length;
            const totalCount = section.lectures.length;
            const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            return (
              <AccordionItem
                key={section.id}
                value={`section-${sectionIndex}`}
                className="border-b border-border/20 last:border-b-0"
              >
                {/*
                  Override the built-in hover:underline that shadcn adds to AccordionTrigger.
                  `[&>span:last-child]:no-underline` targets the chevron wrapper span.
                  `[&>div]:hover:no-underline` targets our custom content div.
                  The `no-underline` class + `hover:no-underline` at root level handles everything.
                  We also use `hover:no-underline` on the trigger itself.
                */}
                <AccordionTrigger
                  className={cn(
                    'px-4 py-3 hover:bg-muted/20 hover:no-underline transition-colors',
                    // Remove underline from ALL child elements including the inner span
                    '[&>*]:no-underline [&>*]:hover:no-underline',
                    '[&>span]:no-underline [&>span]:decoration-0',
                    'text-left'
                  )}
                >
                  {/* Custom section header content */}
                  <div className="flex-1 min-w-0 space-y-1.5 mr-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 no-underline">
                        {section.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono flex-shrink-0">
                        {completedCount}/{totalCount}
                      </span>
                    </div>
                    {/* Thin progress bar */}
                    <div className="w-full h-0.5 bg-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-0 py-0 pb-1">
                  {section.lectures.map((lecture) => {
                    const isActive = lecture.id === currentLectureId;

                    return (
                      <button
                        key={lecture.id}
                        onClick={() => onLectureSelect(lecture)}
                        className={cn(
                          'w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-all duration-150',
                          'border-l-2',
                          isActive
                            ? 'bg-primary/8 border-l-primary'
                            : 'border-l-transparent hover:bg-muted/15 hover:border-l-border/60'
                        )}
                      >
                        {/* Icon */}
                        <div className="mt-0.5">{getLectureIcon(lecture, isActive)}</div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className={cn(
                            'text-xs leading-relaxed line-clamp-2',
                            isActive
                              ? 'text-primary font-medium'
                              : 'text-foreground/80'
                          )}>
                            {lecture.title}
                          </p>

                          {/* Meta */}
                          <div className="flex items-center gap-2">
                            {lecture.lectureType === 'text' && (
                              <span className="text-[10px] text-muted-foreground">Article</span>
                            )}
                            {(lecture.duration ?? 0) > 0 && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatDuration(lecture.duration ?? 0)}
                              </span>
                            )}
                            {lecture.isCompleted && (
                              <span className="flex items-center gap-0.5 text-[10px] text-success">
                                <Check className="w-3 h-3" />
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}

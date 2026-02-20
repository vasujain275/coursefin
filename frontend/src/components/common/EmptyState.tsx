// ============================================================================
// EmptyState - CourseFin
// ============================================================================
// Purpose: Reusable empty state component
// Architecture: Icon + Title + Description + Optional CTA with entrance animation
// ============================================================================

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in-up">
      {/* Icon */}
      {icon && (
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-6 animate-glow-pulse">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
          size="lg"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

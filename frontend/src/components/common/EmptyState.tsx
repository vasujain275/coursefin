// ============================================================================
// EmptyState - CourseFin
// ============================================================================
// Purpose: Reusable empty state component
// Architecture: Icon + Title + Description + Optional CTA
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
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Icon */}
      {icon && (
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Action */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6"
          size="lg"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

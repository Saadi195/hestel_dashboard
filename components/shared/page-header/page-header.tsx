import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  heading: string;
  description?: string;
  className?: string;
}

export function PageHeader({ heading, description, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
    </div>
  );
}

interface DashboardShellProps {
  heading: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Standard page container for all dashboard pages.
 *
 * Provides consistent heading, description, optional action button,
 * and content area layout.
 */
export function DashboardShell({
  heading,
  description,
  action,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

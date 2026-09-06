import { getCurrentUser } from '@/lib/auth/session';
import { getInitials } from '@/lib/utils/formatting';

export async function DashboardHeader() {
  const user = await getCurrentUser();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div>
        {/* Breadcrumb will be added here */}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-muted-foreground text-sm">{user.name ?? user.email}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {getInitials(user.name ?? user.email)}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

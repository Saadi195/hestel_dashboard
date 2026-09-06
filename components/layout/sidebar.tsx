'use client';

import {
  LayoutDashboard,
  Users,
  DoorOpen,
  Bed,
  LogIn,
  LogOut,
  Bell,
  CreditCard,
  Shield,
  AlertTriangle,
  Receipt,
  MessageSquare,
  UserCheck,
  UserCog,
  BarChart3,
  ClipboardList,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { signOut } from '@/features/auth/actions';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/residents', label: 'Residents', icon: Users },
  { href: '/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/beds', label: 'Beds', icon: Bed },
  { href: '/check-in', label: 'Check In', icon: LogIn },
  { href: '/check-out', label: 'Check Out', icon: LogOut },
  { href: '/notices', label: 'Notices', icon: Bell },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/deposits', label: 'Deposits', icon: Shield },
  { href: '/fines', label: 'Fines', icon: AlertTriangle },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/complaints', label: 'Complaints', icon: MessageSquare },
  { href: '/visitors', label: 'Visitors', icon: UserCheck },
  { href: '/employees', label: 'Employees', icon: UserCog },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/activity-logs', label: 'Activity Logs', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch {
      // Ignore redirect navigation error
    }
    router.push('/login');
  };

  return (
    <>
      <aside className="bg-sidebar text-sidebar-foreground flex w-64 flex-col border-r">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-bold tracking-tight">🏠 Hostel MS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button Footer */}
        <div className="border-t p-3">
          <button
            type="button"
            onClick={() => setShowLogoutDialog(true)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 shrink-0 text-destructive" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Dialog Popup */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogHeader>
          <DialogTitle>Sign Out Confirmation</DialogTitle>
          <DialogDescription>
            Are you sure you want to sign out of the Hostel Management System?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowLogoutDialog(false)}
            disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing Out...' : 'Yes, Sign Out'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}


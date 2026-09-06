import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
export const metadata: Metadata = { title: 'Reports' };
export default function ReportsPage() {
  return (
    <DashboardShell heading="Reports" description="View financial and operational reports">
      <p className="text-muted-foreground text-sm">Reports coming soon.</p>
    </DashboardShell>
  );
}

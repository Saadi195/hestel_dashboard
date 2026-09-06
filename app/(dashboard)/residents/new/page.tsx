import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = { title: 'New Resident' };

export default function NewResidentPage() {
  return (
    <DashboardShell
      heading="Add Resident"
      description="Register a new resident"
    >
      {/* NewResidentForm will be imported from features/residents/components */}
      <p className="text-muted-foreground text-sm">Resident registration form coming soon.</p>
    </DashboardShell>
  );
}

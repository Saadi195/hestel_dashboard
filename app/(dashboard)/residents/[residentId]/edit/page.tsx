import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = { title: 'Edit Resident' };

interface EditResidentPageProps {
  params: Promise<{ residentId: string }>;
}

export default async function EditResidentPage({ params }: EditResidentPageProps) {
  const { residentId } = await params;

  return (
    <DashboardShell
      heading="Edit Resident"
      description={`Editing resident ${residentId}`}
    >
      {/* EditResidentForm will be imported from features/residents/components */}
      <p className="text-muted-foreground text-sm">Edit resident form coming soon.</p>
    </DashboardShell>
  );
}

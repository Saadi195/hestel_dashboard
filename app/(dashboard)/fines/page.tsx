import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FinesClientWrapper } from '@/features/fines/components/fines-client-wrapper';
import { FineService } from '@/features/fines/services/fine-service';
import { ResidentService } from '@/features/residents/services/resident-service';

export const metadata: Metadata = {
  title: 'Fines & Penalties Management',
};

export default async function FinesPage() {
  const fineService = new FineService();
  const residentService = new ResidentService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const fines = await fineService.getFines(defaultHostelId).catch(() => []);
  const residentsResult = await residentService.getResidents(defaultHostelId, 1, 100).catch(() => ({ data: [] }));

  return (
    <DashboardShell
      heading="Fines & Penalties Management"
      description="Issue disciplinary fines, record payment transactions, and authorize fine waivers with reason logs"
    >
      <FinesClientWrapper
        hostelId={defaultHostelId}
        fines={fines}
        residents={residentsResult.data}
      />
    </DashboardShell>
  );
}

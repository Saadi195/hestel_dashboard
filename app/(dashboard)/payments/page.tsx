import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PaymentsClientWrapper } from '@/features/payments/components/payments-client-wrapper';
import { RentService } from '@/features/payments/services/rent-service';
import { ResidentService } from '@/features/residents/services/resident-service';

export const metadata: Metadata = {
  title: 'Rent & Payments Management',
};

export default async function PaymentsPage() {
  const rentService = new RentService();
  const residentService = new ResidentService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const charges = await rentService.getRentCharges(defaultHostelId).catch(() => []);
  const residentsResult = await residentService.getResidents(defaultHostelId, 1, 100).catch(() => ({ data: [] }));

  return (
    <DashboardShell
      heading="Rent & Payments Management"
      description="Track monthly rent charges, record payment transactions, and monitor outstanding balances"
    >
      <PaymentsClientWrapper
        hostelId={defaultHostelId}
        charges={charges}
        residents={residentsResult.data}
      />
    </DashboardShell>
  );
}

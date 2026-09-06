import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DepositsClientWrapper } from '@/features/deposits/components/deposits-client-wrapper';
import { DepositService } from '@/features/deposits/services/deposit-service';
import { ResidentService } from '@/features/residents/services/resident-service';

export const metadata: Metadata = {
  title: 'Security Deposits Management',
};

export default async function DepositsPage() {
  const depositService = new DepositService();
  const residentService = new ResidentService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const deposits = await depositService.getDeposits(defaultHostelId).catch(() => []);
  const residentsResult = await residentService.getResidents(defaultHostelId, 1, 100).catch(() => ({ data: [] }));

  return (
    <DashboardShell
      heading="Security Deposits Management"
      description="Track security deposit requirements, record installment payments, and manage approved deductions"
    >
      <DepositsClientWrapper
        hostelId={defaultHostelId}
        deposits={deposits}
        residents={residentsResult.data}
      />
    </DashboardShell>
  );
}

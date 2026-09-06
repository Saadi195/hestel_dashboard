import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ResidentsClientWrapper } from '@/features/residents/components/residents-client-wrapper';
import { ResidentService } from '@/features/residents/services/resident-service';

export const metadata: Metadata = {
  title: 'Residents Management',
};

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);

  const residentService = new ResidentService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const result = await residentService.getResidents(defaultHostelId, page, 15).catch(() => ({
    data: [],
    total: 0,
    page: 1,
    limit: 15,
    hasNextPage: false,
  }));

  return (
    <DashboardShell
      heading="Residents Management"
      description="Manage resident profiles, lifecycle statuses, and bed assignments"
    >
      <ResidentsClientWrapper
        hostelId={defaultHostelId}
        data={result.data}
        page={result.page}
        totalPages={result.hasNextPage ? result.page + 1 : result.page}
      />
    </DashboardShell>
  );
}

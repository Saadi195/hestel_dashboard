import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ResidentStatus } from '@/domain/residents/entities';
import { NoticesClientWrapper } from '@/features/notices/components/notices-client-wrapper';
import { NoticeService } from '@/features/notices/services/notice-service';
import { ResidentService } from '@/features/residents/services/resident-service';

export const metadata: Metadata = {
  title: 'Notice Management',
};

export default async function NoticesPage() {
  const noticeService = new NoticeService();
  const residentService = new ResidentService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const notices = await noticeService.getNotices(defaultHostelId).catch(() => []);
  const residentsResult = await residentService.getResidents(defaultHostelId, 1, 100).catch(() => ({ data: [] }));
  const activeResidents = residentsResult.data.filter((r) => r.status === ResidentStatus.ACTIVE);

  return (
    <DashboardShell
      heading="Notice Management"
      description="Track resident 15-day checkout notices, expected checkout dates, and countdown days"
    >
      <NoticesClientWrapper
        hostelId={defaultHostelId}
        notices={notices}
        residents={activeResidents}
      />
    </DashboardShell>
  );
}

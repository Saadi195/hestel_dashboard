import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
export const metadata: Metadata = { title: 'Room Details' };
interface RoomDetailPageProps { params: Promise<{ roomId: string }> }
export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { roomId } = await params;
  return (
    <DashboardShell heading="Room Details" description={`Viewing room ${roomId}`}>
      <p className="text-muted-foreground text-sm">Room detail coming soon.</p>
    </DashboardShell>
  );
}

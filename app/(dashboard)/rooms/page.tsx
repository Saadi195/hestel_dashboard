import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoomsClientWrapper } from '@/features/rooms/components/rooms-client-wrapper';
import { RoomService } from '@/features/rooms/services/room-service';

export const metadata: Metadata = {
  title: 'Rooms Management',
};

export default async function RoomsPage() {
  const roomService = new RoomService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const rooms = await roomService.getRooms(defaultHostelId).catch(() => []);

  return (
    <DashboardShell
      heading="Rooms Management"
      description="Configure physical rooms, capacities, monthly rent, and view derived occupancy"
    >
      <RoomsClientWrapper hostelId={defaultHostelId} rooms={rooms} />
    </DashboardShell>
  );
}

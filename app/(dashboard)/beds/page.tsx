import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { BedsClientWrapper } from '@/features/beds/components/beds-client-wrapper';
import { BedService, type BedWithOccupancy } from '@/features/beds/services/bed-service';
import { RoomService } from '@/features/rooms/services/room-service';

export const metadata: Metadata = {
  title: 'Beds Management',
};

export default async function BedsPage() {
  const roomService = new RoomService();
  const bedService = new BedService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const rooms = await roomService.getRooms(defaultHostelId).catch(() => []);

  const bedsByRoom: Record<string, BedWithOccupancy[]> = {};
  await Promise.all(
    rooms.map(async (room) => {
      const beds = await bedService.getBedsByRoom(room.id).catch(() => []);
      bedsByRoom[room.id] = beds;
    }),
  );

  return (
    <DashboardShell
      heading="Beds Management"
      description="Manage individual bed operational statuses and view resident assignments"
    >
      <BedsClientWrapper rooms={rooms} bedsByRoom={bedsByRoom} />
    </DashboardShell>
  );
}

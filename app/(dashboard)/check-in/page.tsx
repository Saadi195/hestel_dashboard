import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ResidentStatus } from '@/domain/residents/entities';
import { BedService, type BedWithOccupancy } from '@/features/beds/services/bed-service';
import { CheckInWizard } from '@/features/check-in/components/check-in-wizard';
import { ResidentService } from '@/features/residents/services/resident-service';
import { RoomService } from '@/features/rooms/services/room-service';

export const metadata: Metadata = {
  title: 'Resident Check-In',
};

export default async function CheckInPage() {
  const residentService = new ResidentService();
  const roomService = new RoomService();
  const bedService = new BedService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  // Fetch reserved residents eligible for check-in
  const allResidents = await residentService.getResidents(defaultHostelId, 1, 100).catch(() => ({ data: [] }));
  const eligibleResidents = allResidents.data.filter((r) => r.status === ResidentStatus.RESERVED);

  // Fetch rooms
  const rooms = await roomService.getRooms(defaultHostelId).catch(() => []);

  // Fetch beds by room
  const availableBedsByRoom: Record<string, BedWithOccupancy[]> = {};
  await Promise.all(
    rooms.map(async (room) => {
      const beds = await bedService.getBedsByRoom(room.id).catch(() => []);
      availableBedsByRoom[room.id] = beds;
    }),
  );

  return (
    <DashboardShell
      heading="Resident Check-In"
      description="Assign eligible reserved residents to rooms and beds with date tracking"
    >
      <CheckInWizard
        eligibleResidents={eligibleResidents}
        rooms={rooms}
        availableBedsByRoom={availableBedsByRoom}
      />
    </DashboardShell>
  );
}

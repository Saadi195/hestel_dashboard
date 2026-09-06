'use client';

import { DoorOpen } from 'lucide-react';
import * as React from 'react';

import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';

import type { RoomWithOccupancy } from '../services/room-service';

import { CreateRoomDialog } from './create-room-dialog';

export interface RoomsClientWrapperProps {
  hostelId: string;
  rooms: RoomWithOccupancy[];
}

export function RoomsClientWrapper({ hostelId, rooms }: RoomsClientWrapperProps) {
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns: Column<RoomWithOccupancy>[] = [
    {
      header: 'Room Number',
      cell: (room) => (
        <div>
          <span className="font-semibold text-base">{room.roomNumber}</span>
          <p className="text-xs text-muted-foreground">Floor {room.floor ?? 1}</p>
        </div>
      ),
    },
    {
      header: 'Room Type',
      cell: (room) => <span className="text-xs font-medium">{room.roomType}</span>,
    },
    {
      header: 'Monthly Rent',
      cell: (room) => <CurrencyDisplay amount={room.monthlyRent} className="font-medium" />,
    },
    {
      header: 'Operational Status',
      cell: (room) => <StatusBadge status={room.operationalStatus} />,
    },
    {
      header: 'Derived Occupancy',
      cell: (room) => (
        <div className="space-y-1">
          <StatusBadge status={room.derivedOccupancy} />
          <p className="text-xs text-muted-foreground">
            {room.activeAssignmentsCount} of {room.capacity} occupied
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <DoorOpen className="mr-2 h-4 w-4" />
          Add New Room
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        keyExtractor={(room) => room.id}
        emptyTitle="No rooms configured"
        emptyDescription="Get started by adding your first room to the hostel."
      />

      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        hostelId={hostelId}
      />
    </div>
  );
}

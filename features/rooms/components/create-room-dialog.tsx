'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { RoomType, OperationalStatus } from '@/domain/rooms/entities';

import { createRoomAction } from '../actions/room-actions';

export interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelId?: string;
}

export function CreateRoomDialog({ open, onOpenChange, hostelId }: CreateRoomDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [selectedHostelId, setSelectedHostelId] = React.useState(
    hostelId || '00000000-0000-0000-0000-000000000001',
  );
  const [roomNumber, setRoomNumber] = React.useState('');
  const [floor, setFloor] = React.useState('1');
  const [roomType, setRoomType] = React.useState<RoomType>(RoomType.DOUBLE);
  const [capacity, setCapacity] = React.useState('2');
  const [monthlyRent, setMonthlyRent] = React.useState('15000');
  const [description, setDescription] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const targetHostelId = selectedHostelId || hostelId || '00000000-0000-0000-0000-000000000001';

    const res = await createRoomAction({
      hostelId: targetHostelId,
      roomNumber,
      floor: parseInt(floor, 10),
      roomType,
      capacity: parseInt(capacity, 10),
      operationalStatus: OperationalStatus.AVAILABLE,
      monthlyRent: parseFloat(monthlyRent),
      description: description || undefined,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      setRoomNumber('');
      setDescription('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Add New Room</DialogTitle>
        <DialogDescription>Create a physical room record in the hostel.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20 font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Hostel Branch *</label>
          <Select
            value={selectedHostelId}
            onChange={(e) => setSelectedHostelId(e.target.value)}
          >
            <option value="00000000-0000-0000-0000-000000000001">Hostel Alpha — Main Campus</option>
            <option value="00000000-0000-0000-0000-000000000002">Hostel Beta — Executive Wing</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Room Number *</label>
            <Input
              required
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 101"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Floor Number</label>
            <Input
              type="number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Room Type</label>
            <Select value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType)}>
              <option value={RoomType.SINGLE}>SINGLE</option>
              <option value={RoomType.DOUBLE}>DOUBLE</option>
              <option value={RoomType.TRIPLE}>TRIPLE</option>
              <option value={RoomType.DORMITORY}>DORMITORY</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium">Bed Capacity *</label>
            <Input
              type="number"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Monthly Rent (PKR) *</label>
          <Input
            type="number"
            required
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details (e.g. Attached washroom, Balcony)"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

'use client';

import { UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Resident } from '@/domain/residents/entities';
import type { Room } from '@/domain/rooms/entities';
import type { BedWithOccupancy } from '@/features/beds/services/bed-service';

import { checkInResidentAction } from '../actions/check-in-actions';

export interface CheckInWizardProps {
  eligibleResidents: Resident[];
  rooms: Room[];
  availableBedsByRoom: Record<string, BedWithOccupancy[]>;
}

export function CheckInWizard({
  eligibleResidents,
  rooms,
  availableBedsByRoom,
}: CheckInWizardProps) {
  const router = useRouter();
  const initialRoomId = rooms[0]?.id ?? '';
  const initialBeds = availableBedsByRoom[initialRoomId] ?? [];
  const initialBedId = initialBeds.find((b) => !b.hasActiveAssignment)?.id ?? '';

  const [selectedResidentId, setSelectedResidentId] = React.useState(eligibleResidents[0]?.id ?? '');
  const [selectedRoomId, setSelectedRoomId] = React.useState(initialRoomId);
  const [selectedBedId, setSelectedBedId] = React.useState(initialBedId);
  const [checkInDate, setCheckInDate] = React.useState(new Date().toISOString().split('T')[0] ?? '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const currentAvailableBeds = availableBedsByRoom[selectedRoomId] ?? [];

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const beds = availableBedsByRoom[roomId] ?? [];
    const firstAvailable = beds.find((b) => !b.hasActiveAssignment);
    setSelectedBedId(firstAvailable?.id ?? '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId || !selectedBedId) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await checkInResidentAction({
      residentId: selectedResidentId,
      bedId: selectedBedId,
      checkInDate,
    });

    setIsLoading(false);

    if (res.success) {
      router.push('/residents');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  if (eligibleResidents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No residents currently eligible for check-in. (Residents must be in 'RESERVED' status).
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <span>Resident Check-In Wizard</span>
        </CardTitle>
        <CardDescription>
          Assign an eligible reserved resident to an available room and bed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-medium">1. Select Resident (RESERVED Status) *</label>
            <Select value={selectedResidentId} onChange={(e) => setSelectedResidentId(e.target.value)}>
              {eligibleResidents.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.fullName} ({res.phone})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium">2. Select Room *</label>
              <Select value={selectedRoomId} onChange={(e) => handleRoomChange(e.target.value)}>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} ({room.roomType})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium">3. Select Available Bed *</label>
              {currentAvailableBeds.length === 0 ? (
                <p className="text-xs text-destructive mt-2 font-medium">No available beds in this room.</p>
              ) : (
                <Select value={selectedBedId} onChange={(e) => setSelectedBedId(e.target.value)}>
                  {currentAvailableBeds.map((bed) => (
                    <option
                      key={bed.id}
                      value={bed.id}
                      disabled={bed.hasActiveAssignment || bed.operationalStatus === 'MAINTENANCE'}
                    >
                      Bed {bed.bedNumber} {bed.hasActiveAssignment ? '(Occupied)' : ''}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">4. Check-In Date *</label>
            <Input
              type="date"
              required
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedBedId}>
              {isLoading ? 'Processing Check-In...' : 'Confirm Check-In'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

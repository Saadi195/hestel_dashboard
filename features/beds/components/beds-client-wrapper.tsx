'use client';

import { Bed as BedIcon, Plus, Wrench, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { OperationalStatus, type Room } from '@/domain/rooms/entities';

import { updateBedStatusAction, createBedAction } from '../actions/bed-actions';
import type { BedWithOccupancy } from '../services/bed-service';

export interface BedsClientWrapperProps {
  rooms: Room[];
  bedsByRoom: Record<string, BedWithOccupancy[]>;
}

export function BedsClientWrapper({ rooms, bedsByRoom }: BedsClientWrapperProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedRoomId, setSelectedRoomId] = React.useState(rooms[0]?.id ?? '');
  const [bedNumber, setBedNumber] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleToggleMaintenance = async (bedId: string, currentStatus: OperationalStatus) => {
    const nextStatus =
      currentStatus === OperationalStatus.AVAILABLE
        ? OperationalStatus.MAINTENANCE
        : OperationalStatus.AVAILABLE;

    await updateBedStatusAction({ id: bedId, operationalStatus: nextStatus });
    router.refresh();
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await createBedAction({
      roomId: selectedRoomId,
      bedNumber,
      operationalStatus: OperationalStatus.AVAILABLE,
    });

    setIsLoading(false);

    if (res.success) {
      setCreateOpen(false);
      setBedNumber('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  if (rooms.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg">
        Please create rooms first before adding and managing beds.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bed to Room
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const beds = bedsByRoom[room.id] ?? [];
          return (
            <Card key={room.id} className="relative">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">
                    Room {room.roomNumber}
                  </CardTitle>
                  <StatusBadge status={room.operationalStatus} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {room.roomType} • Capacity: {room.capacity} beds
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {beds.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No beds created in this room.
                  </p>
                ) : (
                  beds.map((bed) => (
                    <div
                      key={bed.id}
                      className="flex items-center justify-between rounded-lg border p-3 bg-card"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="rounded-full bg-muted p-2">
                          <BedIcon className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Bed {bed.bedNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {bed.assignedResidentName ? (
                              <span className="text-primary font-medium">
                                Assigned: {bed.assignedResidentName}
                              </span>
                            ) : (
                              'Unassigned'
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <StatusBadge status={bed.operationalStatus} />
                        <Button
                          variant="ghost"
                          size="icon"
                          title={
                            bed.operationalStatus === OperationalStatus.AVAILABLE
                              ? 'Mark for Maintenance'
                              : 'Mark as Available'
                          }
                          onClick={() => handleToggleMaintenance(bed.id, bed.operationalStatus)}
                        >
                          {bed.operationalStatus === OperationalStatus.AVAILABLE ? (
                            <Wrench className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader>
          <DialogTitle>Add Bed to Room</DialogTitle>
          <DialogDescription>Create a physical bed in a selected room.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateBed} className="space-y-4 mt-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-medium">Select Room *</label>
            <Select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.roomType})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium">Bed Identifier / Number *</label>
            <Input
              required
              value={bedNumber}
              onChange={(e) => setBedNumber(e.target.value)}
              placeholder="e.g. Bed A / Bed 1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Bed'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

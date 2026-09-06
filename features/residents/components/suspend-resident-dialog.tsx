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

import { suspendResidentAction } from '../actions/resident-actions';

export interface SuspendResidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  residentName: string;
}

export function SuspendResidentDialog({
  open,
  onOpenChange,
  residentId,
  residentName,
}: SuspendResidentDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [reason, setReason] = React.useState('');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0] ?? '');
  const [endDate, setEndDate] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await suspendResidentAction({
      residentId,
      reason,
      startDate,
      endDate: endDate || undefined,
      notes: notes || undefined,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      setReason('');
      setNotes('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Suspend Resident</DialogTitle>
        <DialogDescription>
          Record suspension details for <span className="font-semibold text-foreground">{residentName}</span>.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Suspension Reason *</label>
          <Input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Non-payment of rent / Disciplinary violation"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Start Date *</label>
            <Input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Expected End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Additional Notes</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional internal remarks"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm Suspension'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

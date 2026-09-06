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
import type { Resident } from '@/domain/residents/entities';

import { submitNoticeAction } from '../actions/notice-actions';

export interface SubmitNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelId: string;
  residents: Resident[];
}

export function SubmitNoticeDialog({
  open,
  onOpenChange,
  hostelId,
  residents,
}: SubmitNoticeDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [residentId, setResidentId] = React.useState(residents[0]?.id ?? '');
  const [noticeDate, setNoticeDate] = React.useState(new Date().toISOString().split('T')[0] ?? '');
  const [noticePeriodDays, setNoticePeriodDays] = React.useState('15');
  const [reason, setReason] = React.useState('');

  const hasResidents = residents.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (!residentId) {
      setErrorMsg('Please select a resident to submit the notice for.');
      setIsLoading(false);
      return;
    }

    const res = await submitNoticeAction({
      hostelId: hostelId || '00000000-0000-0000-0000-000000000001',
      residentId,
      noticeDate,
      noticePeriodDays: parseInt(noticePeriodDays, 10),
      reason: reason || undefined,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      setReason('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Submit Checkout Notice</DialogTitle>
        <DialogDescription>
          Register a resident checkout notice. The server will calculate the expected checkout date.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        {!hasResidents ? (
          <div className="p-3 text-xs bg-amber-50 text-amber-700 rounded-md border border-amber-200">
            ⚠️ No residents found. Please register a resident first before submitting a checkout notice.
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium">Select Active Resident *</label>
            <Select value={residentId} onChange={(e) => setResidentId(e.target.value)}>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} ({r.phone})
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Notice Date *</label>
            <Input
              type="date"
              required
              value={noticeDate}
              onChange={(e) => setNoticeDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Notice Period (Days) *</label>
            <Input
              type="number"
              required
              value={noticePeriodDays}
              onChange={(e) => setNoticePeriodDays(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Reason for Checkout</label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Relocating to new city / Course completion"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !hasResidents}>
            {isLoading ? 'Submitting...' : 'Submit Notice'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

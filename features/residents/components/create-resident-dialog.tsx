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
import { ResidentStatus } from '@/domain/residents/entities';

import { createResidentAction } from '../actions/resident-actions';

export interface CreateResidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelId?: string;
}

export function CreateResidentDialog({ open, onOpenChange, hostelId }: CreateResidentDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [selectedHostelId, setSelectedHostelId] = React.useState(
    hostelId || '00000000-0000-0000-0000-000000000001',
  );
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [guardianName, setGuardianName] = React.useState('');
  const [emergencyContactName, setEmergencyContactName] = React.useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState('');
  const [cnic, setCnic] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [status, setStatus] = React.useState<ResidentStatus>(ResidentStatus.RESERVED);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const targetHostelId = selectedHostelId || hostelId || '00000000-0000-0000-0000-000000000001';

    const res = await createResidentAction({
      hostelId: targetHostelId,
      fullName,
      phone,
      guardianName: guardianName || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      cnic: cnic || undefined,
      address: address || undefined,
      status,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      // Reset form
      setFullName('');
      setPhone('');
      setGuardianName('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setCnic('');
      setAddress('');
      setStatus(ResidentStatus.RESERVED);
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Register New Resident</DialogTitle>
        <DialogDescription>Enter personal and contact details for the resident.</DialogDescription>
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
            <label className="text-xs font-medium">Full Name *</label>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ali Khan"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Phone Number *</label>
            <Input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300-1234567"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Guardian Name</label>
            <Input
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="e.g. Tariq Khan"
            />
          </div>
          <div>
            <label className="text-xs font-medium">CNIC Number</label>
            <Input
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              placeholder="42101-1234567-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Emergency Contact Name</label>
            <Input
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="Contact Person"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Emergency Phone</label>
            <Input
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="0312-9876543"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Address</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="City, Street address"
          />
        </div>

        <div>
          <label className="text-xs font-medium">Initial Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as ResidentStatus)}>
            <option value={ResidentStatus.RESERVED}>RESERVED</option>
            <option value={ResidentStatus.ACTIVE}>ACTIVE</option>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Register Resident'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

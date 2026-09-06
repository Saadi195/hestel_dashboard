'use client';

import { Ban } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';

import { SuspendResidentDialog } from './suspend-resident-dialog';

export interface ResidentDetailClientWrapperProps {
  residentId: string;
  residentName: string;
}

export function ResidentDetailClientWrapper({
  residentId,
  residentName,
}: ResidentDetailClientWrapperProps) {
  const [suspendOpen, setSuspendOpen] = React.useState(false);

  return (
    <div className="flex items-center space-x-2">
      <Button variant="destructive" size="sm" onClick={() => setSuspendOpen(true)}>
        <Ban className="mr-2 h-4 w-4" />
        Suspend Resident
      </Button>

      <SuspendResidentDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        residentId={residentId}
        residentName={residentName}
      />
    </div>
  );
}

'use client';

import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import type { Resident } from '@/domain/residents/entities';

import { CreateResidentDialog } from './create-resident-dialog';

export interface ResidentsClientWrapperProps {
  hostelId: string;
  data: Resident[];
  page: number;
  totalPages: number;
}

export function ResidentsClientWrapper({
  hostelId,
  data,
  page,
  totalPages,
}: ResidentsClientWrapperProps) {
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns: Column<Resident>[] = [
    {
      header: 'Full Name',
      cell: (res) => (
        <div>
          <Link
            href={`/residents/${res.id}`}
            className="font-medium text-primary hover:underline"
          >
            {res.fullName}
          </Link>
          <p className="text-xs text-muted-foreground">{res.phone}</p>
        </div>
      ),
    },
    {
      header: 'CNIC (PII)',
      cell: (res) => (
        <span className="text-xs font-mono text-muted-foreground">
          {res.cnic ? `${res.cnic.slice(0, 6)}*******${res.cnic.slice(-2)}` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (res) => <StatusBadge status={res.status} />,
    },
    {
      header: 'Registered Date',
      cell: (res) => <DateDisplay date={res.createdAt} className="text-xs" />,
    },
    {
      header: 'Actions',
      cell: (res) => (
        <div className="flex items-center space-x-2">
          <Link href={`/residents/${res.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Register Resident
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
        emptyTitle="No residents registered"
        emptyDescription="Get started by registering a new resident using the button above."
        page={page}
        totalPages={totalPages}
      />

      <CreateResidentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        hostelId={hostelId}
      />
    </div>
  );
}

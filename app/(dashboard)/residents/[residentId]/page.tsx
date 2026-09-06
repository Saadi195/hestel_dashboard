import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResidentDetailClientWrapper } from '@/features/residents/components/resident-detail-client-wrapper';
import { ResidentService } from '@/features/residents/services/resident-service';

export const metadata: Metadata = {
  title: 'Resident Details',
};

export default async function ResidentDetailPage({
  params,
}: {
  params: Promise<{ residentId: string }>;
}) {
  const resolvedParams = await params;
  const residentService = new ResidentService();
  const resident = await residentService.getResidentById(resolvedParams.residentId).catch(() => null);

  if (!resident) {
    notFound();
  }

  return (
    <DashboardShell
      heading={resident.fullName}
      description={`Resident ID: #${resident.id.slice(0, 8)}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            <StatusBadge status={resident.status} />
            <span className="text-xs text-muted-foreground">
              Phone: <strong className="text-foreground">{resident.phone}</strong>
            </span>
          </div>
          <ResidentDetailClientWrapper residentId={resident.id} residentName={resident.fullName} />
        </div>

        <Tabs defaultValue="personal">
          <TabsList>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="assignment">Assignment History</TabsTrigger>
            <TabsTrigger value="financial">Financial Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal & Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Full Name</p>
                  <p className="font-medium">{resident.fullName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone Number</p>
                  <p className="font-medium">{resident.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Guardian Name</p>
                  <p className="font-medium">{resident.guardianName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">CNIC (Protected PII)</p>
                  <p className="font-medium font-mono text-xs">
                    {resident.cnic ? `${resident.cnic.slice(0, 6)}*******${resident.cnic.slice(-2)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Emergency Contact</p>
                  <p className="font-medium">
                    {resident.emergencyContactName ? `${resident.emergencyContactName} (${resident.emergencyContactPhone ?? ''})` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Address</p>
                  <p className="font-medium">{resident.address ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Registered Date</p>
                  <DateDisplay date={resident.createdAt} className="font-medium" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignment">
            <Card>
              <CardHeader>
                <CardTitle>Bed Assignment History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No previous bed assignments recorded for this resident.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No rent charges or security deposit transactions found.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

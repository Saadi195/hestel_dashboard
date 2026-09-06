import {
  Users,
  Bell,
  Bed,
  DoorOpen,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DateDisplay } from '@/components/shared/date-display';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DashboardService } from '@/features/dashboard/services/dashboard-service';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const dashboardService = new DashboardService();
  const metrics = await dashboardService.getDashboardMetrics().catch(() => ({
    totalResidents: 0,
    activeResidents: 0,
    noticePeriodResidents: 0,
    totalRooms: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    pendingRent: 0,
    outstandingFines: 0,
    securityDepositsHeld: 0,
    pendingCheckoutRequests: 0,
    recentActivity: [],
  }));

  return (
    <DashboardShell
      heading="Dashboard Overview"
      description="Real-time operational & financial metrics"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Residents"
          value={metrics.totalResidents}
          description={`${metrics.activeResidents} active residents`}
          icon={Users}
        />
        <StatCard
          title="Available Beds"
          value={metrics.availableBeds}
          description={`${metrics.occupiedBeds} occupied of ${metrics.totalBeds} total`}
          icon={Bed}
        />
        <StatCard
          title="Notice Period Residents"
          value={metrics.noticePeriodResidents}
          description={`${metrics.pendingCheckoutRequests} pending checkouts`}
          icon={Bell}
        />
        <StatCard
          title="Total Rooms"
          value={metrics.totalRooms}
          description="Physical rooms recorded"
          icon={DoorOpen}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          title="Pending Rent"
          value={<CurrencyDisplay amount={metrics.pendingRent} />}
          description="Total uncollected rent balance"
          icon={DollarSign}
          iconClassName="text-amber-500 bg-amber-500/10"
        />
        <StatCard
          title="Outstanding Fines"
          value={<CurrencyDisplay amount={metrics.outstandingFines} />}
          description="Total unpaid fine balance"
          icon={AlertTriangle}
          iconClassName="text-red-500 bg-red-500/10"
        />
        <StatCard
          title="Security Deposits Held"
          value={<CurrencyDisplay amount={metrics.securityDepositsHeld} />}
          description="Total active deposit balances"
          icon={ShieldCheck}
          iconClassName="text-emerald-500 bg-emerald-500/10"
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent audit logs available.</p>
            ) : (
              <div className="space-y-3">
                {metrics.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.entityType} {activity.entityId ? `#${activity.entityId.slice(0, 8)}` : ''}
                      </p>
                    </div>
                    <DateDisplay date={activity.createdAt} className="text-xs text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

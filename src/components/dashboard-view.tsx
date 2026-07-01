import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/service";
import type { TenantContext } from "@/lib/app-types";
import { formatCurrency } from "@/lib/utils";

export function DashboardView({ tenant, dashboard }: { tenant: TenantContext; dashboard: DashboardData }) {
  const chart = buildChart(dashboard.revenueSeries);
  const maxStatus = Math.max(...dashboard.shipmentStatus.map((item) => item.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live command center for {tenant.company.name} in {tenant.company.timezone}.
          </p>
        </div>
        <Badge variant="success">Live database values</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl">
                {metric.format === "currency"
                  ? formatCurrency(Number(metric.value), tenant.company.currency)
                  : metric.format === "percent"
                    ? `${metric.value}%`
                    : metric.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{metric.delta}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue chart</CardTitle>
            <CardDescription>Revenue and shipment volume by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 rounded-md border bg-muted/20 p-4">
              <svg viewBox="0 0 640 260" className="h-full w-full" role="img" aria-label="Revenue chart">
                <defs>
                  <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => (
                  <line key={line} x1="0" x2="640" y1={40 + line * 55} y2={40 + line * 55} stroke="var(--border)" />
                ))}
                <polygon
                  points={`0,205 ${chart.areaPoints} 640,205`}
                  fill="url(#revenue-fill)"
                />
                <polyline
                  points={chart.linePoints}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="grid grid-cols-6 text-[10px] text-muted-foreground sm:text-xs">
                {dashboard.revenueSeries.map((item) => <span key={item.label}>{item.label}</span>)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipment status summary</CardTitle>
            <CardDescription>Operational load by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.shipmentStatus.length ? dashboard.shipmentStatus.map((item) => (
                <div key={item.label} className="grid gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.max(8, (item.value / maxStatus) * 100)}%` }}
                    />
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No shipment data recorded yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activities</CardTitle>
          <CardDescription>Audit-friendly activity stream across modules.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {dashboard.recentActivities.length ? dashboard.recentActivities.map((activity) => (
            <div key={activity} className="rounded-md border bg-muted/30 p-3 text-sm">
              {activity}
            </div>
          )) : <p className="text-sm text-muted-foreground">No recent activity recorded yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function buildChart(series: DashboardData["revenueSeries"]) {
  const maxRevenue = Math.max(...series.map((item) => item.revenue), 1);
  const step = 640 / Math.max(series.length - 1, 1);
  const points = series.map((item, index) => {
    const x = Math.round(index * step);
    const y = Math.round(205 - (item.revenue / maxRevenue) * 170);
    return `${x},${y}`;
  });
  return {
    linePoints: points.join(" "),
    areaPoints: points.join(" "),
  };
}

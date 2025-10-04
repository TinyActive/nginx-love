import { useTranslation } from "react-i18next";
import React from "react";
import {
  LayoutDashboard,
  Globe,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Suspense } from "react";
import {
  useSuspenseDashboardStats,
  useSuspenseSystemMetrics,
  useSuspenseRecentAlerts,
} from "@/queries";
import type {
  DashboardStats,
  DashboardAlert,
} from "@/services/dashboard.service";
import { SkeletonStatsCard, SkeletonChart, SkeletonTable } from "@/components/ui/skeletons";

// Component for fast-loading stats data
function DashboardStats() {
  const { t } = useTranslation();
  
  // Use suspense query for fast data
  const { data: stats } = useSuspenseDashboardStats();

  const activeDomains = stats?.domains.active || 0;
  const errorDomains = stats?.domains.errors || 0;
  const unacknowledgedAlerts = stats?.alerts.unacknowledged || 0;
  const criticalAlerts = stats?.alerts.critical || 0;

  const statsCards = [
    {
      title: t("dashboard.domains"),
      value: stats?.domains.total || 0,
      description: `${activeDomains} active, ${errorDomains} errors`,
      icon: Globe,
      color: "text-primary",
    },
    {
      title: t("dashboard.traffic"),
      value: stats?.traffic.requestsPerDay || "0",
      description: "Requests/day",
      icon: LayoutDashboard,
      color: "text-success",
    },
    {
      title: t("dashboard.errors"),
      value: errorDomains,
      description: "Domains with issues",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: t("dashboard.uptime"),
      value: `${stats?.uptime || "0"}%`,
      description: "Last 30 days",
      icon: CheckCircle2,
      color: "text-success",
    },
  ];

  return (
    <>
      {unacknowledgedAlerts > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You have <strong>{unacknowledgedAlerts}</strong> unacknowledged
              alerts
              {criticalAlerts > 0 && `, including ${criticalAlerts} critical`}.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// Component for deferred chart data
function DashboardCharts() {
  const { data: stats } = useSuspenseDashboardStats();
  const { data: metrics } = useSuspenseSystemMetrics("24h");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CPU Usage</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </div>
            {stats?.system && (
              <div className="text-right">
                <div
                  className="text-2xl font-bold"
                  style={{
                    color:
                      stats.system.cpuUsage > 80
                        ? "hsl(var(--destructive))"
                        : stats.system.cpuUsage > 60
                        ? "hsl(var(--warning))"
                        : "hsl(var(--success))",
                  }}
                >
                  {stats.system.cpuUsage.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.system.cpuCores} cores
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {metrics?.cpu && metrics.cpu.length > 0 ? (
            <ChartContainer
              config={{
                cpu: {
                  label: "CPU Usage",
                  color: "var(--color-primary)",
                },
              }}
              className="h-[200px] w-full"
            >
              <LineChart data={metrics.cpu}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getHours()}:00`;
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: any) => [
                        `${Number(value).toFixed(2)}%`,
                        "CPU Usage",
                      ]}
                      labelFormatter={(label: any) => {
                        const date = new Date(label);
                        return date.toLocaleString("vi-VN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-cpu)"
                  strokeWidth={2}
                  dot={false}
                  name="cpu"
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <SkeletonChart height="h-[200px]" showHeader={false} showLegend={false} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Memory Usage</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </div>
            {stats?.system && (
              <div className="text-right">
                <div
                  className="text-2xl font-bold"
                  style={{
                    color:
                      stats.system.memoryUsage > 85
                        ? "hsl(var(--destructive))"
                        : stats.system.memoryUsage > 70
                        ? "hsl(var(--warning))"
                        : "hsl(var(--success))",
                  }}
                >
                  {stats.system.memoryUsage.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  System Memory
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {metrics?.memory && metrics.memory.length > 0 ? (
            <ChartContainer
              config={{
                memory: {
                  label: "Memory Usage",
                  color: "var(--color-primary)",
                },
              }}
              className="h-[200px] w-full"
            >
              <LineChart data={metrics.memory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getHours()}:00`;
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: any) => [
                        `${Number(value).toFixed(2)}%`,
                        "Memory Usage",
                      ]}
                      labelFormatter={(label: any) => {
                        const date = new Date(label);
                        return date.toLocaleString("vi-VN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-memory)"
                  strokeWidth={2}
                  dot={false}
                  name="memory"
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <SkeletonChart height="h-[200px]" showHeader={false} showLegend={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Component for deferred alerts data
function DashboardAlerts() {
  const { data: recentAlerts } = useSuspenseRecentAlerts(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentAlerts && recentAlerts.length > 0 ? (
            recentAlerts.map((alert: DashboardAlert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      alert.severity === "critical"
                        ? "destructive"
                        : alert.severity === "warning"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {alert.severity}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.source}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent alerts</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Dashboard component with Suspense boundaries
export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="text-muted-foreground">{t("dashboard.overview")}</p>
          </div>
        </div>
      </div>

      {/* Fast-loading stats data - loaded immediately via route loader */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatsCard key={i} />
          ))}
        </div>
      }>
        <DashboardStats />
      </Suspense>

      {/* Deferred chart data - loaded after initial render */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonChart title="CPU Usage" description="Last 24 hours" />
          <SkeletonChart title="Memory Usage" description="Last 24 hours" />
        </div>
      }>
        <DashboardCharts />
      </Suspense>

      {/* Deferred alerts data - loaded after initial render */}
      <Suspense fallback={
        <SkeletonTable rows={5} columns={3} title="Recent Alerts" />
      }>
        <DashboardAlerts />
      </Suspense>
    </div>
  );
}

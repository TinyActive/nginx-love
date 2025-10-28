import { useTranslation } from "react-i18next";
import { Suspense, useState } from "react";
import {
  LayoutDashboard,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Shield,
  TrendingUp,
  Clock,
  Users,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useSuspenseDashboardStats,
  useSuspenseRequestTrend,
  useSuspenseSlowRequests,
  useSuspenseLatestAttackStats,
  useSuspenseLatestNews,
  useSuspenseRequestAnalytics,
  useSuspenseAttackRatio,
} from "@/queries";
import { SkeletonStatsCard, SkeletonChart, SkeletonTable } from "@/components/ui/skeletons";

// Constants for status codes and colors
const STATUS_CODES_CONFIG = [
  { key: "status200", color: "#22c55e", label: "dashboard.status200" },
  { key: "status301", color: "#3b82f6", label: "dashboard.status301" },
  { key: "status302", color: "#06b6d4", label: "dashboard.status302" },
  { key: "status400", color: "#f59e0b", label: "dashboard.status400" },
  { key: "status403", color: "#f97316", label: "dashboard.status403" },
  { key: "status404", color: "#eab308", label: "dashboard.status404" },
  { key: "status500", color: "#ef4444", label: "dashboard.status500" },
  { key: "status502", color: "#dc2626", label: "dashboard.status502" },
  { key: "status503", color: "#b91c1c", label: "dashboard.status503" },
] as const;

// Helper function to format time
const formatTime = (date: Date) => 
  `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

// Helper function to get attack percentage color
const getAttackPercentageColor = (percentage: number) => {
  if (percentage > 10) return "text-destructive";
  if (percentage > 5) return "text-warning";
  return "text-success";
};

// Helper function to get severity badge variant
const getSeverityVariant = (severity: string): "destructive" | "default" => {
  return severity === "CRITICAL" || severity === "2" ? "destructive" : "default";
};

// Reusable Empty State Component
const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-8 text-muted-foreground text-sm">
    {message}
  </div>
);

// Reusable Card Header with Icon
const CardHeaderWithIcon = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description?: string;
}) => (
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5" />
      {title}
    </CardTitle>
    {description && <CardDescription>{description}</CardDescription>}
  </CardHeader>
);

// Component for stats overview
function DashboardStatsOverview() {
  const { t } = useTranslation();
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
              You have <strong>{unacknowledgedAlerts}</strong> unacknowledged alerts
              {criticalAlerts > 0 && `, including ${criticalAlerts} critical`}.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// Component for Request Trend Chart
function RequestTrendChart() {
  const { t } = useTranslation();
  const { data: trendData } = useSuspenseRequestTrend(5);

  // Generate chart config dynamically
  const chartConfig = Object.fromEntries(
    STATUS_CODES_CONFIG.map(({ key, color, label }) => [
      key,
      { label: t(label), color }
    ])
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("dashboard.requestTrend")}
            </CardTitle>
            <CardDescription>{t("dashboard.requestTrendDesc")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {trendData && trendData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => formatTime(new Date(value))}
                />
                <YAxis />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label: any) => new Date(label).toLocaleString()}
                    />
                  }
                />
                <Legend />
                {STATUS_CODES_CONFIG.map(({ key, color, label }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    name={t(label)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <EmptyState message={t("dashboard.noData")} />
        )}
      </CardContent>
    </Card>
  );
}

// Component for Slow Requests
function SlowRequestsCard() {
  const { t } = useTranslation();
  const { data: slowRequests } = useSuspenseSlowRequests(10);

  return (
    <Card>
      <CardHeaderWithIcon
        icon={Clock}
        title={t("dashboard.slowRequests")}
        description={t("dashboard.slowRequestsDesc")}
      />
      <CardContent>
        {slowRequests && slowRequests.length > 0 ? (
          <div className="space-y-2">
            {slowRequests.slice(0, 3).map((req, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.path}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.requestCount} requests
                  </p>
                </div>
                <Badge variant="outline" className="ml-2 shrink-0">
                  {req.avgResponseTime.toFixed(2)}ms
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message={t("dashboard.noData")} />
        )}
      </CardContent>
    </Card>
  );
}

// Component for Attack Ratio
function AttackRatioCard() {
  const { t } = useTranslation();
  const { data: attackRatio } = useSuspenseAttackRatio();

  const metrics = [
    { label: "dashboard.attackRequests", value: attackRatio?.attackRequests, variant: "destructive" as const },
    { label: "dashboard.normalRequests", value: attackRatio?.normalRequests, variant: "secondary" as const },
  ];

  return (
    <Card>
      <CardHeaderWithIcon
        icon={Shield}
        title={t("dashboard.attackRatio")}
        description={t("dashboard.attackRatioDesc")}
      />
      <CardContent>
        {attackRatio ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("dashboard.totalRequests")}</span>
              <span className="text-2xl font-bold">
                {attackRatio.totalRequests.toLocaleString()}
              </span>
            </div>
            <div className="space-y-2">
              {metrics.map(({ label, value, variant }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(label)}</span>
                  <Badge variant={variant}>{value?.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("dashboard.attackPercentage")}</span>
                <span className={`text-xl font-bold ${getAttackPercentageColor(attackRatio.attackPercentage)}`}>
                  {attackRatio.attackPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState message={t("dashboard.noData")} />
        )}
      </CardContent>
    </Card>
  );
}

// Component for Latest Attacks
function LatestAttacksCard() {
  const { t } = useTranslation();
  const { data: attacks } = useSuspenseLatestAttackStats(5);

  return (
    <Card>
      <CardHeaderWithIcon
        icon={AlertTriangle}
        title={t("dashboard.latestAttacks")}
        description={t("dashboard.latestAttacksDesc")}
      />
      <CardContent>
        {attacks && attacks.length > 0 ? (
          <div className="space-y-3">
            {attacks.map((attack, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{attack.attackType}</p>
                  <p className="text-xs text-muted-foreground">
                    Last: {new Date(attack.lastOccurred).toLocaleString()}
                  </p>
                </div>
                <Badge variant={getSeverityVariant(attack.severity)}>
                  {attack.count}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message={t("dashboard.noData")} />
        )}
      </CardContent>
    </Card>
  );
}

// Component for Latest News Table
function LatestNewsTable() {
  const { t } = useTranslation();
  const { data: news } = useSuspenseLatestNews(10);

  const handleViewDetails = (item: any) => {
    const url = item.uniqueId
      ? `/logs?uniqueId=${encodeURIComponent(item.uniqueId)}`
      : `/logs?search=${encodeURIComponent(item.ruleId || item.attackType)}`;
    window.location.href = url;
  };

  const tableHeaders = [
    { key: "timestamp", label: "dashboard.timestamp", width: "w-[140px]" },
    { key: "attackerIp", label: "dashboard.attackerIp", width: "w-[120px]" },
    { key: "domain", label: "dashboard.domain", width: "w-[140px]" },
    { key: "attackType", label: "dashboard.attackType" },
    { key: "action", label: "dashboard.action" },
    { key: "actions", label: "dashboard.actions", align: "text-right" },
  ];

  return (
    <Card>
      <CardHeaderWithIcon
        icon={TrendingUp}
        title={t("dashboard.latestNews")}
        description={t("dashboard.latestNewsDesc")}
      />
      <CardContent>
        {news && news.length > 0 ? (
          <div className="rounded-md border max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableHeaders.map(({ key, label, width, align }) => (
                    <TableHead key={key} className={`${width || ''} ${align || ''}`}>
                      {t(label)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.attackerIp}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[140px]">
                      {item.domain || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.attackType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.action}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(item)}>
                        <Eye className="h-4 w-4 mr-1" />
                        {t("dashboard.viewDetails")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState message={t("dashboard.noData")} />
        )}
      </CardContent>
    </Card>
  );
}

// Component for Request Analytics (IP Analytics)
function RequestAnalyticsCard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { data: analytics } = useSuspenseRequestAnalytics(period);

  const periods = ['day', 'week', 'month'] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("dashboard.requestAnalytics")}
            </CardTitle>
            <CardDescription>{t("dashboard.requestAnalyticsDesc")}</CardDescription>
          </div>
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`dashboard.period.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {analytics && analytics.topIps.length > 0 ? (
          <div className="rounded-md border max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.sourceIp")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.requestCount")}</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead className="text-right">Attacks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topIps.map((ip, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{ip.ip}</TableCell>
                    <TableCell className="text-right font-medium">
                      {ip.requestCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {ip.errorCount > 0 ? (
                        <Badge variant="destructive">{ip.errorCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {ip.attackCount > 0 ? (
                        <Badge variant="destructive">{ip.attackCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState message={t("dashboard.noData")} />
        )}
      </CardContent>
    </Card>
  );
}

// Main Dashboard component with Suspense boundaries
export default function DashboardNew() {
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

      {/* Stats Overview */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatsCard key={i} />
            ))}
          </div>
        }
      >
        <DashboardStatsOverview />
      </Suspense>

      {/* Row 1: Request Trend Chart + Attack Ratio */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Suspense
          fallback={
            <SkeletonChart
              title={t("dashboard.requestTrend")}
              description={t("dashboard.requestTrendDesc")}
              height="h-[320px]"
            />
          }
        >
          <div className="lg:col-span-2">
            <RequestTrendChart />
          </div>
        </Suspense>

        <Suspense fallback={<SkeletonChart title={t("dashboard.attackRatio")} />}>
          <AttackRatioCard />
        </Suspense>
      </div>

      {/* Row 2: Latest Attacks + Request Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<SkeletonChart title={t("dashboard.latestAttacks")} />}>
          <LatestAttacksCard />
        </Suspense>

        <Suspense
          fallback={
            <SkeletonTable
              rows={5}
              columns={4}
              title={t("dashboard.requestAnalytics")}
            />
          }
        >
          <RequestAnalyticsCard />
        </Suspense>
      </div>

      {/* Row 3: Slow Requests + Latest News */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<SkeletonChart title={t("dashboard.slowRequests")} />}>
          <SlowRequestsCard />
        </Suspense>

        <Suspense
          fallback={
            <SkeletonTable
              rows={8}
              columns={6}
              title={t("dashboard.latestNews")}
            />
          }
        >
          <LatestNewsTable />
        </Suspense>
      </div>
    </div>
  );
}

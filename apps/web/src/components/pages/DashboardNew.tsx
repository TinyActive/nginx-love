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

// Reusable Count Badge Component
const CountBadge = ({ count, variant = "destructive" }: { count: number; variant?: "destructive" | "secondary" }) => (
  count > 0 ? (
    <Badge variant={variant}>{count}</Badge>
  ) : (
    <span className="text-muted-foreground">0</span>
  )
);

// Reusable List Item Component
const ListItem = ({ 
  title, 
  subtitle, 
  badge 
}: { 
  title: string; 
  subtitle: string; 
  badge: React.ReactNode;
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
    <div className="flex-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
    {badge}
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

// Reusable Metric Row Component
const MetricRow = ({ 
  label, 
  value, 
  valueClassName = "" 
}: { 
  label: string; 
  value: React.ReactNode; 
  valueClassName?: string;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">{label}</span>
    <span className={valueClassName}>{value}</span>
  </div>
);

// Reusable Data Card Component
const DataCard = ({
  icon,
  title,
  description,
  data,
  emptyMessage,
  children
}: {
  icon: any;
  title: string;
  description?: string;
  data: any;
  emptyMessage: string;
  children: (data: any) => React.ReactNode;
}) => (
  <Card>
    <CardHeaderWithIcon icon={icon} title={title} description={description} />
    <CardContent>
      {data && (Array.isArray(data) ? data.length > 0 : true) ? (
        children(data)
      ) : (
        <EmptyState message={emptyMessage} />
      )}
    </CardContent>
  </Card>
);

// Reusable Table Card Component
const TableCard = ({
  icon,
  title,
  description,
  data,
  emptyMessage,
  headers,
  renderRow,
  maxHeight = "max-h-[400px]"
}: {
  icon: any;
  title: string;
  description?: string;
  data: any[];
  emptyMessage: string;
  headers: TableHeader[];
  renderRow: (item: any) => React.ReactNode;
  maxHeight?: string;
}) => (
  <DataCard icon={icon} title={title} description={description} data={data} emptyMessage={emptyMessage}>
    {(items) => (
      <div className={`rounded-md border ${maxHeight} overflow-auto`}>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(({ key, label, width, align }) => (
                <TableHead key={key} className={`${width || ''} ${align || ''}`}>
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(renderRow)}
          </TableBody>
        </Table>
      </div>
    )}
  </DataCard>
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
    <DataCard
      icon={Clock}
      title={t("dashboard.slowRequests")}
      description={t("dashboard.slowRequestsDesc")}
      data={slowRequests}
      emptyMessage={t("dashboard.noData")}
    >
      {(data) => (
        <div className="space-y-2">
          {data.slice(0, 3).map((req: any, idx: number) => (
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
      )}
    </DataCard>
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
    <DataCard
      icon={Shield}
      title={t("dashboard.attackRatio")}
      description={t("dashboard.attackRatioDesc")}
      data={attackRatio}
      emptyMessage={t("dashboard.noData")}
    >
      {(data) => (
        <div className="space-y-4">
          <MetricRow
            label={t("dashboard.totalRequests")}
            value={data.totalRequests.toLocaleString()}
            valueClassName="text-2xl font-bold"
          />
          <div className="space-y-2">
            {metrics.map(({ label, value, variant }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t(label)}</span>
                <Badge variant={variant}>{value?.toLocaleString()}</Badge>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <MetricRow
              label={t("dashboard.attackPercentage")}
              value={`${data.attackPercentage.toFixed(2)}%`}
              valueClassName={`text-xl font-bold ${getAttackPercentageColor(data.attackPercentage)}`}
            />
          </div>
        </div>
      )}
    </DataCard>
  );
}

// Component for Latest Attacks
function LatestAttacksCard() {
  const { t } = useTranslation();
  const { data: attacks } = useSuspenseLatestAttackStats(5);

  return (
    <DataCard
      icon={AlertTriangle}
      title={t("dashboard.latestAttacks")}
      description={t("dashboard.latestAttacksDesc")}
      data={attacks}
      emptyMessage={t("dashboard.noData")}
    >
      {(data) => (
        <div className="space-y-3">
          {data.map((attack: any, idx: number) => (
            <ListItem
              key={idx}
              title={attack.attackType}
              subtitle={`Last: ${new Date(attack.lastOccurred).toLocaleString()}`}
              badge={<Badge variant={getSeverityVariant(attack.severity)}>{attack.count}</Badge>}
            />
          ))}
        </div>
      )}
    </DataCard>
  );
}

// Table headers configuration
type TableHeader = { key: string; label: string; width?: string; align?: string };

const NEWS_TABLE_HEADERS: TableHeader[] = [
  { key: "timestamp", label: "dashboard.timestamp", width: "w-[140px]" },
  { key: "attackerIp", label: "dashboard.attackerIp", width: "w-[120px]" },
  { key: "domain", label: "dashboard.domain", width: "w-[140px]" },
  { key: "attackType", label: "dashboard.attackType" },
  { key: "action", label: "dashboard.action" },
  { key: "actions", label: "dashboard.actions", align: "text-right" },
];

const IP_TABLE_HEADERS: TableHeader[] = [
  { key: "sourceIp", label: "dashboard.sourceIp" },
  { key: "requestCount", label: "dashboard.requestCount", align: "text-right" },
  { key: "errors", label: "Errors", align: "text-right" },
  { key: "attacks", label: "Attacks", align: "text-right" },
];

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

  const headers = NEWS_TABLE_HEADERS.map(h => ({ ...h, label: t(h.label) }));

  return (
    <TableCard
      icon={TrendingUp}
      title={t("dashboard.latestNews")}
      description={t("dashboard.latestNewsDesc")}
      data={news || []}
      emptyMessage={t("dashboard.noData")}
      headers={headers}
      renderRow={(item: any) => (
        <TableRow key={item.id}>
          <TableCell className="font-mono text-xs whitespace-nowrap">
            {new Date(item.timestamp).toLocaleString()}
          </TableCell>
          <TableCell className="font-mono text-sm">{item.attackerIp}</TableCell>
          <TableCell className="text-sm truncate max-w-[140px]">{item.domain || '-'}</TableCell>
          <TableCell><Badge variant="outline">{item.attackType}</Badge></TableCell>
          <TableCell><Badge variant="destructive">{item.action}</Badge></TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(item)}>
              <Eye className="h-4 w-4 mr-1" />
              {t("dashboard.viewDetails")}
            </Button>
          </TableCell>
        </TableRow>
      )}
    />
  );
}

// Component for Request Analytics (IP Analytics)
function RequestAnalyticsCard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { data: analytics } = useSuspenseRequestAnalytics(period);

  const periods = ['day', 'week', 'month'] as const;
  const headers = IP_TABLE_HEADERS.map(h => ({
    ...h,
    label: h.key === 'sourceIp' || h.key === 'requestCount' ? t(h.label) : h.label
  }));

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
                  {headers.map(({ key, label, align }) => (
                    <TableHead key={key} className={align || ''}>
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topIps.map((ip: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{ip.ip}</TableCell>
                    <TableCell className="text-right font-medium">
                      {ip.requestCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <CountBadge count={ip.errorCount} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CountBadge count={ip.attackCount} />
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

      {/* Dashboard Rows */}
      {[
        {
          cols: "lg:grid-cols-3",
          items: [
            { component: <RequestTrendChart />, fallback: <SkeletonChart title={t("dashboard.requestTrend")} description={t("dashboard.requestTrendDesc")} height="h-[320px]" />, className: "lg:col-span-2" },
            { component: <AttackRatioCard />, fallback: <SkeletonChart title={t("dashboard.attackRatio")} /> },
          ]
        },
        {
          cols: "lg:grid-cols-2",
          items: [
            { component: <LatestAttacksCard />, fallback: <SkeletonChart title={t("dashboard.latestAttacks")} /> },
            { component: <RequestAnalyticsCard />, fallback: <SkeletonTable rows={5} columns={4} title={t("dashboard.requestAnalytics")} /> },
          ]
        },
        {
          cols: "lg:grid-cols-2",
          items: [
            { component: <SlowRequestsCard />, fallback: <SkeletonChart title={t("dashboard.slowRequests")} /> },
            { component: <LatestNewsTable />, fallback: <SkeletonTable rows={8} columns={6} title={t("dashboard.latestNews")} /> },
          ]
        },
      ].map((row, rowIdx) => (
        <div key={rowIdx} className={`grid gap-4 ${row.cols}`}>
          {row.items.map((item, itemIdx) => (
            <Suspense key={itemIdx} fallback={item.fallback}>
              <div className={item.className || ""}>
                {item.component}
              </div>
            </Suspense>
          ))}
        </div>
      ))}
    </div>
  );
}

import { useState, useEffect, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Clock, Zap, AlertTriangle } from "lucide-react";
import { domainService } from "@/services/domain.service";
import { SkeletonStatsCard, SkeletonTable } from "@/components/ui/skeletons";
import { useSuspensePerformanceStats, useSuspensePerformanceMetrics } from "@/queries/performance.query-options";

// Component for fast-loading stats data
const PerformanceStats = ({ domain, timeRange, onError }: { domain: string; timeRange: string; onError: (error: string) => void }) => {
  const { data: stats } = useSuspensePerformanceStats(domain, timeRange);
  
  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold) return "text-red-500";
    if (value > threshold * 0.7) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getStatusColor(stats.avgResponseTime, 200)}`}>
            {stats.avgResponseTime.toFixed(0) + 'ms'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Average across all requests
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Throughput</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">
            {stats.avgThroughput.toFixed(0) + ' req/s'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requests per second
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getStatusColor(stats.avgErrorRate, 3)}`}>
            {stats.avgErrorRate.toFixed(2) + '%'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            4xx and 5xx responses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalRequests.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            In selected time range
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for deferred chart/metrics data
const PerformanceMetrics = ({ domain, timeRange, onError }: { domain: string; timeRange: string; onError: (error: string) => void }) => {
  const { data: metrics } = useSuspensePerformanceMetrics(domain, timeRange);
  
  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold) return "text-red-500";
    if (value > threshold * 0.7) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Performance Timeline</CardTitle>
          <CardDescription>Detailed performance metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Throughput</TableHead>
                  <TableHead>Error Rate</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No performance data available
                    </TableCell>
                  </TableRow>
                ) : (
                  metrics.slice(0, 15).map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-medium">{metric.domain}</TableCell>
                      <TableCell className={getStatusColor(metric.responseTime, 200)}>
                        {metric.responseTime.toFixed(0)}ms
                      </TableCell>
                      <TableCell>{metric.throughput.toFixed(0)} req/s</TableCell>
                      <TableCell className={getStatusColor(metric.errorRate, 3)}>
                        {metric.errorRate.toFixed(2)}%
                      </TableCell>
                      <TableCell>{metric.requestCount}</TableCell>
                      <TableCell>
                        <Badge variant={
                          metric.responseTime > 200 || metric.errorRate > 3 ? 'destructive' :
                          metric.responseTime > 140 || metric.errorRate > 2 ? 'default' : 'default'
                        }>
                          {metric.responseTime > 200 || metric.errorRate > 3 ? 'Degraded' :
                           metric.responseTime > 140 || metric.errorRate > 2 ? 'Warning' : 'Healthy'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Slow Requests</CardTitle>
            <CardDescription>Requests with response time &gt; 200ms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <>
                {metrics
                  .filter(m => m.responseTime > 200)
                  .slice(0, 5)
                  .map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{metric.domain}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(metric.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="destructive">{metric.responseTime.toFixed(0)}ms</Badge>
                    </div>
                  ))}
                {metrics.filter(m => m.responseTime > 200).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No slow requests detected</p>
                )}
              </>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High Error Rate Periods</CardTitle>
            <CardDescription>Time periods with error rate &gt; 3%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <>
                {metrics
                  .filter(m => m.errorRate > 3)
                  .slice(0, 5)
                  .map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{metric.domain}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(metric.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="destructive">{metric.errorRate.toFixed(2)}%</Badge>
                    </div>
                  ))}
                {metrics.filter(m => m.errorRate > 3).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No high error rate detected</p>
                )}
              </>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const Performance = () => {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("1h");
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Fetch domains on mount
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const domainsResponse = await domainService.getAll();
        
        // Extract the actual domains array from the response
        const domainsArray = domainsResponse.data || [];
        
        setDomains(domainsArray);
        setNetworkError(null);
      } catch (error) {
        console.error('Failed to fetch domains:', error);
        setNetworkError('Failed to fetch domains. Please check your network connection.');
      }
    };
    fetchDomains();
  }, []);

  return (
    <div className="space-y-6">
      {networkError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{networkError}</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Monitoring</h1>
            <p className="text-muted-foreground">Real-time performance metrics and analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {Array.isArray(domains) && domains.map(domain => (
                <SelectItem key={domain.id} value={domain.name}>{domain.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">Last 5 minutes</SelectItem>
              <SelectItem value="15m">Last 15 minutes</SelectItem>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fast-loading stats data - loaded immediately via route loader */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
        </div>
      }>
        <PerformanceStats domain={selectedDomain} timeRange={timeRange} onError={setNetworkError} />
      </Suspense>

      {/* Deferred chart/metrics data - loaded after initial render */}
      <Suspense fallback={
        <>
          <Card>
            <CardHeader>
              <CardTitle>Performance Timeline</CardTitle>
              <CardDescription>Detailed performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <SkeletonTable rows={10} columns={7} />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Slow Requests</CardTitle>
                <CardDescription>Requests with response time &gt; 200ms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>High Error Rate Periods</CardTitle>
                <CardDescription>Time periods with error rate &gt; 3%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      }>
        <PerformanceMetrics domain={selectedDomain} timeRange={timeRange} onError={setNetworkError} />
      </Suspense>
    </div>
  );
};

export default Performance;

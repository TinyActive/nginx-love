import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
} from "lucide-react";
import {
  useQueryState,
  parseAsInteger,
  parseAsString,
} from "nuqs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogEntry } from "@/types";
import { downloadLogs } from "@/services/logs.service";
import { useToast } from "@/hooks/use-toast";
import { SkeletonStatsCard, SkeletonTable } from "@/components/ui/skeletons";
import {
  useSuspenseLogStatistics,
  useSuspenseAvailableDomains,
  useSuspenseLogs,
  useLogs
} from "@/queries/logs.query-options";
import { LogDetailsDialog } from "@/components/logs/LogDetailsDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Constants
const LEVEL_OPTIONS = [
  { value: "all", label: "All Levels" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
] as const;

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "access", label: "Access" },
  { value: "error", label: "Error" },
  { value: "system", label: "System" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

const STATS_CONFIG = [
  { key: "total", label: "Total Logs", color: "", description: "All log entries" },
  { key: "info", label: "Info Logs", color: "text-blue-500", description: "Information messages", path: "byLevel.info" },
  { key: "warning", label: "Warning Logs", color: "text-yellow-500", description: "Warning messages", path: "byLevel.warning" },
  { key: "error", label: "Error Logs", color: "text-red-500", description: "Error messages", path: "byLevel.error" },
] as const;

// Helper functions
const getLevelColor = (level: string): "destructive" | "default" | "secondary" | "outline" => {
  const colorMap = {
    error: "destructive" as const,
    warning: "outline" as const,
    info: "default" as const,
  };
  return colorMap[level as keyof typeof colorMap] || "secondary";
};

const getTypeColor = (type: string) => {
  const colorMap = {
    access: "default" as const,
    error: "destructive" as const,
    system: "secondary" as const,
  };
  return colorMap[type as keyof typeof colorMap] || "outline";
};

// Get nested value from object path
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

// Build filter parameters helper
const buildFilterParams = (filters: {
  level: string;
  type: string;
  domain: string;
  search: string;
  ruleId: string;
  uniqueId: string;
  page?: number;
  limit?: number;
}) => {
  const params: any = {};
  
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  
  const filterConfigs = [
    { key: 'level', value: filters.level, exclude: 'all' },
    { key: 'type', value: filters.type, exclude: 'all' },
    { key: 'domain', value: filters.domain, exclude: 'all' },
    { key: 'search', value: filters.search },
    { key: 'ruleId', value: filters.ruleId },
    { key: 'uniqueId', value: filters.uniqueId },
  ];

  filterConfigs.forEach(({ key, value, exclude }) => {
    if (value && value !== exclude) params[key] = value;
  });
  
  return params;
};

// Truncatable text component
const TruncatableText = ({ text, maxLength = 40 }: { text: string; maxLength?: number }) => {
  if (text.length <= maxLength) return <div>{text}</div>;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="truncate cursor-help">
          {text.substring(0, maxLength)}...
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-md break-all">
        {text}
      </TooltipContent>
    </Tooltip>
  );
};

// Log details renderer component
const LogDetailsCell = ({ log }: { log: LogEntry }) => {
  const details = [
    { condition: log.ip, label: "IP", value: log.ip },
    { 
      condition: log.method && log.path, 
      value: `${log.method} ${log.path}`,
      truncate: true 
    },
    { condition: log.statusCode, label: "Status", value: log.statusCode },
    { condition: log.responseTime, label: "RT", value: `${log.responseTime}ms` },
    { 
      condition: log.ruleId, 
      label: "Rule ID", 
      value: log.ruleId, 
      className: "font-semibold text-red-600" 
    },
    { condition: log.severity, label: "Severity", value: log.severity },
    { 
      condition: log.tags?.length, 
      label: "Tags", 
      value: log.tags?.join(', '),
      truncate: true 
    },
    { condition: log.uri, label: "URI", value: log.uri, truncate: true },
  ].filter(detail => detail.condition);

  return (
    <div className="text-xs text-muted-foreground space-y-1 max-w-xs">
      {details.map((detail, idx) => {
        const content = detail.label ? `${detail.label}: ${detail.value}` : detail.value;
        const displayContent = detail.truncate ? (
          <TruncatableText text={content} />
        ) : (
          <div className={detail.className}>{content}</div>
        );

        return <div key={idx}>{displayContent}</div>;
      })}
    </div>
  );
};

// Statistics card component
const StatCard = ({ stat, value }: { stat: typeof STATS_CONFIG[number]; value: number }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${stat.color}`}>
        {value.toLocaleString()}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {stat.description}
      </p>
    </CardContent>
  </Card>
);

// Statistics component
const LogStatistics = () => {
  const { data: stats } = useSuspenseLogStatistics();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {STATS_CONFIG.map((stat) => {
        const value = stat.path 
          ? getNestedValue(stats, stat.path)
          : stats[stat.key as keyof typeof stats];
        return <StatCard key={stat.key} stat={stat} value={value} />;
      })}
    </div>
  );
};

// Custom event dispatcher hook
const useCustomEvent = (eventName: string, handler: (value: any) => void) => {
  useEffect(() => {
    const handleEvent = (e: any) => handler(e.detail);
    window.addEventListener(eventName, handleEvent);
    return () => window.removeEventListener(eventName, handleEvent);
  }, [eventName, handler]);
};

const dispatchCustomEvent = (eventName: string, value: any) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: value }));
};

// Filter component
const FilterInput = ({ 
  placeholder, 
  value, 
  eventName,
  className = ""
}: { 
  placeholder: string; 
  value: string; 
  eventName: string;
  className?: string;
}) => (
  <Input
    placeholder={placeholder}
    value={value}
    onChange={(e) => dispatchCustomEvent(eventName, e.target.value)}
    onPaste={(e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      dispatchCustomEvent(eventName, text);
    }}
    className={className}
  />
);

// Filter select component
const FilterSelect = ({
  value,
  options,
  eventName,
  className = "",
  placeholder = "Select"
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  eventName: string;
  className?: string;
  placeholder?: string;
}) => (
  <Select value={value} onValueChange={(val) => dispatchCustomEvent(eventName, val)}>
    <SelectTrigger className={className}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

// Skeleton row component
const SkeletonRow = ({ columnCount }: { columnCount: number }) => (
  <TableRow>
    <TableCell className="font-mono text-xs">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
    </TableCell>
    <TableCell>
      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
    </TableCell>
    <TableCell>
      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
    </TableCell>
    <TableCell>
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
    </TableCell>
    <TableCell>
      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
    </TableCell>
    <TableCell>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
    </TableCell>
    <TableCell>
      <div className="space-y-1">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
      </div>
    </TableCell>
  </TableRow>
);

// Pagination button component
const PaginationButton = ({
  onClick,
  disabled,
  icon: Icon,
  label,
  className = ""
}: {
  onClick: () => void;
  disabled: boolean;
  icon: any;
  label: string;
  className?: string;
}) => (
  <Button
    variant="outline"
    className={`h-8 w-8 p-0 ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    <span className="sr-only">{label}</span>
    <Icon className="h-4 w-4" />
  </Button>
);

// Log entries component
const LogEntries = ({
  page,
  limit,
  search,
  level,
  type,
  domain,
  ruleId,
  uniqueId,
  setPage,
  setLimit,
  sorting,
  setSorting,
  columnFilters,
  setColumnFilters,
  columnVisibility,
  setColumnVisibility,
  rowSelection,
  setRowSelection,
  autoRefresh,
  toast,
  onRefetch,
  selectedLog,
  setSelectedLog
}: {
  page: number;
  limit: number;
  search: string;
  level: string;
  type: string;
  domain: string;
  ruleId: string;
  uniqueId: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
  columnFilters: ColumnFiltersState;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  columnVisibility: VisibilityState;
  setColumnVisibility: (visibility: VisibilityState) => void;
  rowSelection: Record<string, boolean>;
  setRowSelection: (selection: Record<string, boolean>) => void;
  autoRefresh: boolean;
  toast: any;
  onRefetch: (refetch: () => Promise<any>) => void;
  selectedLog: LogEntry | null;
  setSelectedLog: (log: LogEntry | null) => void;
}) => {
  const [isPageChanging, setIsPageChanging] = useState(false);
  
  const stableUniqueId = useMemo(() => uniqueId ? String(uniqueId) : "", [uniqueId]);

  const params = useMemo(() => 
    buildFilterParams({
      level, type, domain, search, ruleId,
      uniqueId: stableUniqueId,
      page, limit
    }),
    [page, limit, level, type, domain, search, ruleId, stableUniqueId]
  );

  const { data: logsResponse, refetch, isFetching, isLoading } = useLogs(params);
  const logs = logsResponse?.data || [];
  const pagination = logsResponse?.pagination || { total: 0, totalPages: 1 };
  
  const { data: domains } = useSuspenseAvailableDomains();
  
  useEffect(() => {
    onRefetch(refetch);
  }, [refetch, onRefetch]);
  
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refetch, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  useEffect(() => {
    setIsPageChanging(isFetching && !isLoading);
  }, [isFetching, isLoading]);

  const handleDownloadLogs = useCallback(async () => {
    try {
      const downloadParams = buildFilterParams({
        level, type, domain, search, ruleId, uniqueId,
        limit: 1000
      });
      await downloadLogs(downloadParams);
      toast({
        title: "Success",
        description: "Logs downloaded successfully",
      });
    } catch (error: any) {
      console.error("Failed to download logs:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to download logs",
        variant: "destructive",
      });
    }
  }, [level, type, domain, search, ruleId, uniqueId, toast]);

  // Define columns
  const columns: ColumnDef<LogEntry>[] = [
    {
      accessorKey: "timestamp",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Timestamp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          {new Date(row.getValue("timestamp")).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => (
        <Badge variant={getLevelColor(row.getValue("level"))}>
          {row.getValue("level")}
        </Badge>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={getTypeColor(row.getValue("type"))}>
          {row.getValue("type")}
        </Badge>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => <div className="font-medium">{row.getValue("source")}</div>,
    },
    {
      accessorKey: "domain",
      header: "Domain",
      cell: ({ row }) => {
        const domain = row.getValue("domain") as string;
        return domain ? (
          <Badge variant="outline" className="font-mono">{domain}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => {
        const log = row.original;
        const displayMessage = log.fullMessage || log.message;
        const hasMore = log.fullMessage && log.fullMessage.length > log.message.length;
        
        return (
          <div className="max-w-md" title={displayMessage}>
            <div className="truncate">{log.message}</div>
            {hasMore && (
              <div className="text-xs text-muted-foreground mt-1">
                Click for full details
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => <LogDetailsCell log={row.original} />,
    },
  ];

  const table = useReactTable({
    data: logs,
    columns,
    onSortingChange: setSorting as any,
    onColumnFiltersChange: setColumnFilters as any,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility as any,
    onRowSelectionChange: setRowSelection as any,
    manualPagination: true,
    manualFiltering: true,
    pageCount: pagination.totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Entries ({pagination.total})</CardTitle>
        <CardDescription>
          Real-time log streaming from nginx and ModSecurity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <FilterInput
              placeholder="Search logs..."
              value={search}
              eventName="searchChange"
              className="pl-10"
            />
          </div>

          <FilterInput
            placeholder="Rule ID..."
            value={ruleId}
            eventName="ruleIdChange"
            className="w-full lg:w-[180px]"
          />

          <FilterInput
            placeholder="Unique ID..."
            value={uniqueId || ""}
            eventName="uniqueIdChange"
            className="w-full lg:w-[180px]"
          />

          <Select value={domain} onValueChange={(val) => dispatchCustomEvent('domainChange', val)}>
            <SelectTrigger className="w-full lg:w-[160px]">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FilterSelect
            value={level}
            options={LEVEL_OPTIONS}
            eventName="levelChange"
            className="w-full lg:w-[120px]"
          />

          <FilterSelect
            value={type}
            options={TYPE_OPTIONS}
            eventName="typeChange"
            className="w-full lg:w-[120px]"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {(isLoading || isPageChanging) ? (
                Array.from({ length: limit }).map((_, i) => <SkeletonRow key={i} columnCount={columns.length} />)
              ) : logs.length > 0 ? (
                logs.map((log, index) => (
                  <TableRow
                    key={log.id || index}
                    data-state={rowSelection[String(log.id || index)] && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLog(log)}
                  >
                    {table.getRowModel().rows[index]?.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div></div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${limit}`}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {page} of {pagination.totalPages || 1}
            </div>
            <div className="flex items-center space-x-2">
              {[
                { icon: ChevronsLeft, onClick: () => setPage(1), disabled: page === 1, label: "Go to first page", className: "hidden lg:flex" },
                { icon: ChevronLeft, onClick: () => setPage(page - 1), disabled: page === 1, label: "Go to previous page" },
                { icon: ChevronRight, onClick: () => setPage(page + 1), disabled: page === pagination.totalPages, label: "Go to next page" },
                { icon: ChevronsRight, onClick: () => setPage(pagination.totalPages || 1), disabled: page === pagination.totalPages, label: "Go to last page", className: "hidden lg:flex" },
              ].map((btn, idx) => (
                <PaginationButton key={idx} {...btn} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
const Logs = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logsRefetch, setLogsRefetch] = useState<(() => Promise<any>) | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // URL state
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [level, setLevel] = useQueryState("level", parseAsString.withDefault("all"));
  const [type, setType] = useQueryState("type", parseAsString.withDefault("all"));
  const [domain, setDomain] = useQueryState("domain", parseAsString.withDefault("all"));
  const [ruleId, setRuleId] = useQueryState("ruleId", parseAsString.withDefault(""));
  
  const [uniqueId, setUniqueIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('uniqueId') || "";
    }
    return "";
  });
  
  const setUniqueId = useCallback((value: string) => {
    setUniqueIdState(value);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      value ? url.searchParams.set('uniqueId', value) : url.searchParams.delete('uniqueId');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Custom event handlers
  useCustomEvent('searchChange', setSearch);
  useCustomEvent('domainChange', setDomain);
  useCustomEvent('levelChange', setLevel);
  useCustomEvent('typeChange', setType);
  useCustomEvent('ruleIdChange', setRuleId);
  useCustomEvent('uniqueIdChange', setUniqueId);

  const handleDownloadLogs = useCallback(async () => {
    try {
      const downloadParams = buildFilterParams({
        level, type, domain, search, ruleId, uniqueId,
        limit: 1000
      });
      await downloadLogs(downloadParams);
      toast({ title: "Success", description: "Logs downloaded successfully" });
    } catch (error: any) {
      console.error("Failed to download logs:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to download logs",
        variant: "destructive",
      });
    }
  }, [level, type, domain, search, ruleId, uniqueId, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
            <p className="text-muted-foreground">
              View and analyze nginx access and error logs
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (logsRefetch) {
                setIsReloading(true);
                try {
                  await logsRefetch();
                } finally {
                  setIsReloading(false);
                }
              }
            }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isReloading ? "animate-spin" : ""}`} />
            Reload
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatsCard key={i} />)}
        </div>
      }>
        <LogStatistics />
      </Suspense>

      <LogEntries
        page={page}
        limit={limit}
        search={search}
        level={level}
        type={type}
        domain={domain}
        ruleId={ruleId}
        uniqueId={uniqueId || ""}
        setPage={setPage}
        setLimit={setLimit}
        sorting={sorting}
        setSorting={setSorting}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        autoRefresh={autoRefresh}
        toast={toast}
        onRefetch={(refetch) => setLogsRefetch(() => refetch)}
        selectedLog={selectedLog}
        setSelectedLog={setSelectedLog}
      />

      <LogDetailsDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  );
};

export default Logs;
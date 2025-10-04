import { useState, useEffect, Suspense } from "react";
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
import {
  downloadLogs,
} from "@/services/logs.service";
import { useToast } from "@/hooks/use-toast";
import { SkeletonStatsCard, SkeletonTable } from "@/components/ui/skeletons";
import {
  useSuspenseLogStatistics,
  useSuspenseAvailableDomains,
  useSuspenseLogs,
  useLogs
} from "@/queries/logs.query-options";

// Component for fast-loading statistics data
const LogStatistics = () => {
  const { data: stats } = useSuspenseLogStatistics();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.total.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All log entries
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Info Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">
            {stats.byLevel.info.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Information messages
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warning Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">
            {stats.byLevel.warning.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Warning messages
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {stats.byLevel.error.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Error messages
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for deferred log entries data
const LogEntries = ({
  page,
  limit,
  search,
  level,
  type,
  domain,
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
  setAutoRefresh,
  toast,
  onRefetch
}: {
  page: number;
  limit: number;
  search: string;
  level: string;
  type: string;
  domain: string;
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
  setAutoRefresh: (refresh: boolean) => void;
  toast: any;
  onRefetch: (refetch: () => Promise<any>) => void;
}) => {
  const [isPageChanging, setIsPageChanging] = useState(false);
  // Build query parameters
  const params: any = {
    page,
    limit,
  };

  if (level !== "all") {
    params.level = level;
  }
  if (type !== "all") {
    params.type = type;
  }
  if (domain !== "all") {
    params.domain = domain;
  }
  if (search) {
    params.search = search;
  }

  // Use regular query instead of suspense query for better control
  const { data: logsResponse, refetch, isFetching, isLoading } = useLogs(params);
  const logs = logsResponse?.data || [];
  const pagination = logsResponse?.pagination || { total: 0, totalPages: 1 };
  
  // Get domains for filter
  const { data: domains } = useSuspenseAvailableDomains();
  
  // Pass refetch function to parent component
  useEffect(() => {
    onRefetch(refetch);
  }, [refetch, onRefetch]);
  
  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Update page changing state based on isFetching
  useEffect(() => {
    setIsPageChanging(isFetching && !isLoading); // Only show skeleton when refetching, not initial load
  }, [isFetching, isLoading]);

  const getLevelColor = (
    level: string
  ): "destructive" | "default" | "secondary" | "outline" => {
    switch (level) {
      case "error":
        return "destructive";
      case "warning":
        return "outline";
      case "info":
        return "default";
      default:
        return "secondary";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "access":
        return "default";
      case "error":
        return "destructive";
      case "system":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleDownloadLogs = async () => {
    try {
      const params: any = { limit: 1000 };

      if (level !== "all") {
        params.level = level;
      }
      if (type !== "all") {
        params.type = type;
      }
      if (domain !== "all") {
        params.domain = domain;
      }
      if (search) {
        params.search = search;
      }

      await downloadLogs(params);
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
  };

  // Define columns for the table
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
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={getTypeColor(row.getValue("type"))}>
          {row.getValue("type")}
        </Badge>
      ),
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("source")}</div>
      ),
    },
    {
      accessorKey: "domain",
      header: "Domain",
      cell: ({ row }) => {
        const domain = row.getValue("domain") as string;
        return domain ? (
          <Badge variant="outline" className="font-mono">
            {domain}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.getValue("message")}>
          {row.getValue("message")}
        </div>
      ),
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="text-xs text-muted-foreground">
            {log.ip && <div>IP: {log.ip}</div>}
            {log.method && log.path && (
              <div>
                {log.method} {log.path}
              </div>
            )}
            {log.statusCode && <div>Status: {log.statusCode}</div>}
            {log.responseTime && <div>RT: {log.responseTime}ms</div>}
          </div>
        );
      },
    },
  ];

  // Create table instance
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
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
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
        <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => {
                // This will be handled by the parent component
                const event = new CustomEvent('searchChange', { detail: e.target.value });
                window.dispatchEvent(event);
              }}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={domain}
              onValueChange={(value) => {
                // This will be handled by the parent component
                const event = new CustomEvent('domainChange', { detail: value });
                window.dispatchEvent(event);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain.name} value={domain.name}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={(value) => {
              // This will be handled by the parent component
              const event = new CustomEvent('levelChange', { detail: value });
              window.dispatchEvent(event);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={(value) => {
              // This will be handled by the parent component
              const event = new CustomEvent('typeChange', { detail: value });
              window.dispatchEvent(event);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="access">Access</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {(isLoading || isPageChanging) ? (
                // Show skeleton rows for initial load or page changes
                Array.from({ length: limit }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
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
                ))
              ) : logs.length > 0 ? (
                logs.map((log, index) => (
                  <TableRow
                    key={log.id || index}
                    data-state={
                      rowSelection[String(log.id || index)] && "selected"
                    }
                  >
                    <TableCell className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelColor(log.level)}>
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(log.type)}>
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.source}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.domain ? (
                        <Badge variant="outline" className="font-mono">
                          {log.domain}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-md truncate"
                      title={log.message}
                    >
                      {log.message}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ip && <div>IP: {log.ip}</div>}
                      {log.method && log.path && (
                        <div>
                          {log.method} {log.path}
                        </div>
                      )}
                      {log.statusCode && <div>Status: {log.statusCode}</div>}
                      {log.responseTime && (
                        <div>RT: {log.responseTime}ms</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
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
                  setPage(1); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {page} of {pagination.totalPages || 1}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPage(page + 1)}
                disabled={page === (pagination.totalPages || 1)}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPage(pagination.totalPages || 1)}
                disabled={page === (pagination.totalPages || 1)}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Logs component
const Logs = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logsRefetch, setLogsRefetch] = useState<(() => Promise<any>) | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // URL state management with nuqs
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(10)
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [level, setLevel] = useQueryState(
    "level",
    parseAsString.withDefault("all")
  );
  const [type, setType] = useQueryState(
    "type",
    parseAsString.withDefault("all")
  );
  const [domain, setDomain] = useQueryState(
    "domain",
    parseAsString.withDefault("all")
  );

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Handle custom events for filter changes from LogEntries component
  useEffect(() => {
    const handleSearchChange = (e: any) => setSearch(e.detail);
    const handleDomainChange = (e: any) => setDomain(e.detail);
    const handleLevelChange = (e: any) => setLevel(e.detail);
    const handleTypeChange = (e: any) => setType(e.detail);

    window.addEventListener('searchChange', handleSearchChange);
    window.addEventListener('domainChange', handleDomainChange);
    window.addEventListener('levelChange', handleLevelChange);
    window.addEventListener('typeChange', handleTypeChange);

    return () => {
      window.removeEventListener('searchChange', handleSearchChange);
      window.removeEventListener('domainChange', handleDomainChange);
      window.removeEventListener('levelChange', handleLevelChange);
      window.removeEventListener('typeChange', handleTypeChange);
    };
  }, [setSearch, setDomain, setLevel, setType]);


  const handleDownloadLogs = async () => {
    try {
      const params: any = { limit: 1000 };

      if (level !== "all") {
        params.level = level;
      }
      if (type !== "all") {
        params.type = type;
      }
      if (domain !== "all") {
        params.domain = domain;
      }
      if (search) {
        params.search = search;
      }

      await downloadLogs(params);
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
  };

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
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
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadLogs}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Fast-loading statistics data - loaded immediately via route loader */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
        </div>
      }>
        <LogStatistics />
      </Suspense>

      {/* Deferred log entries data - loaded after initial render */}
      <LogEntries
        page={page}
        limit={limit}
        search={search}
        level={level}
        type={type}
        domain={domain}
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
        setAutoRefresh={setAutoRefresh}
        toast={toast}
        onRefetch={(refetch) => setLogsRefetch(() => refetch)}
      />
    </div>
  );
};

export default Logs;

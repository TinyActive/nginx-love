import { useState, useEffect } from "react";
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
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  useQueryState,
  useQueryStates,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
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
  getLogs,
  downloadLogs,
  getAvailableDomains,
  DomainInfo,
  PaginatedLogsResponse,
} from "@/services/logs.service";
import { useToast } from "@/hooks/use-toast";

const Logs = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

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

  // Update pagination state when URL params change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page, limit }));
  }, [page, limit]);

  // Fetch domains list
  const fetchDomains = async () => {
    try {
      const data = await getAvailableDomains();
      setDomains(data);
    } catch (error: any) {
      console.error("Failed to fetch domains:", error);
    }
  };

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      setLoading(true);
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

      const response: PaginatedLogsResponse = await getLogs(params);
      setLogs(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (error: any) {
      console.error("Failed to fetch logs:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDomains();
    fetchLogs();
  }, []);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, page, limit, search, level, type, domain]);

  // Refetch when URL params change
  useEffect(() => {
    fetchLogs();
  }, [page, limit, search, level, type, domain]);

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
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
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
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground">
            View and analyze nginx access and error logs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadLogs}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Table Card with Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries ({pagination.total})</CardTitle>
          <CardDescription>
            {loading
              ? "Loading logs..."
              : "Real-time log streaming from nginx and ModSecurity"}
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
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={domain}
                onValueChange={(value) => setDomain(value)}
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

              <Select value={level} onValueChange={(value) => setLevel(value)}>
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

              <Select value={type} onValueChange={(value) => setType(value)}>
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
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-muted-foreground"
                    >
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2">Loading logs...</p>
                    </TableCell>
                  </TableRow>
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
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
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
    </div>
  );
};

export default Logs;

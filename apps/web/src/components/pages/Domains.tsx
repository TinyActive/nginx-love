import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Edit, Trash2, RefreshCw, Shield, ShieldOff, Globe,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DomainDialog } from '@/components/domains/DomainDialog';
import { InstallationProgressDialog } from '@/components/installation/InstallationProgressDialog';
import { toast } from 'sonner';
import {
  useSuspenseDomains,
  useSuspenseInstallationStatus,
  useCreateDomain,
  useUpdateDomain,
  useDeleteDomain,
  useToggleDomainSSL,
  useReloadNginx
} from '@/queries';
import { SkeletonTable } from '@/components/ui/skeletons';
import { useQuery } from '@tanstack/react-query';
import { domainQueryOptions } from '@/queries/domain.query-options';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
} from '@tanstack/react-table';
import type { Domain } from '@/types';

// Column helper for TanStack Table
const columnHelper = createColumnHelper<Domain>();

// Component for domains table with TanStack Table
function DomainsTable() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sslFilter, setSslFilter] = useState<string>('all');
  const [modsecFilter, setModsecFilter] = useState<string>('all');

  // Build query parameters
  const queryParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: searchTerm,
    status: statusFilter === 'all' ? '' : statusFilter,
    sslEnabled: sslFilter === 'all' ? undefined : sslFilter === 'true',
    modsecEnabled: modsecFilter === 'all' ? undefined : modsecFilter === 'true',
    sortBy: sorting[0]?.id || 'createdAt',
    sortOrder: (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc',
  };

  const { data, isLoading, refetch } = useQuery(domainQueryOptions.all(queryParams));
  
  const domains = data?.data || [];
  const paginationInfo = data?.pagination;

  // Update URL with search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sslFilter !== 'all') params.set('sslEnabled', sslFilter);
    if (modsecFilter !== 'all') params.set('modsecEnabled', modsecFilter);
    if (pagination.pageIndex > 0) params.set('page', (pagination.pageIndex + 1).toString());
    if (pagination.pageSize !== 10) params.set('limit', pagination.pageSize.toString());
    if (sorting[0]?.id) params.set('sortBy', sorting[0].id);
    if (sorting[0]?.desc !== undefined) params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, statusFilter, sslFilter, pagination, sorting]);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default' as const,
      inactive: 'secondary' as const,
      error: 'destructive' as const
    };
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  // Define columns for TanStack Table
  const columns = [
    columnHelper.accessor('name', {
      header: t('domains.name'),
      cell: (info) => <div className="font-medium">{info.getValue()}</div>,
    }),
    columnHelper.accessor('status', {
      header: t('domains.status'),
      cell: (info) => getStatusBadge(info.getValue()),
    }),
    columnHelper.accessor('sslEnabled', {
      header: t('domains.ssl'),
      cell: (info) => (
        <Badge variant={info.getValue() ? 'default' : 'secondary'}>
          {info.getValue() ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    }),
    columnHelper.accessor('modsecEnabled', {
      header: t('domains.modsec'),
      cell: (info) => (
        <Badge variant={info.getValue() ? 'default' : 'secondary'}>
          {info.getValue() ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    }),
    columnHelper.accessor('upstreams', {
      header: 'Upstreams',
      cell: (info) => {
        const upstreams = info.getValue();
        return `${upstreams?.length || 0} backend${upstreams?.length !== 1 ? 's' : ''}`;
      },
    }),
    columnHelper.accessor('status', {
      id: 'enabled',
      header: 'Enabled',
      cell: (info) => {
        const domain = info.row.original;
        return (
          <Switch
            checked={domain.status === 'active'}
            onCheckedChange={(checked) => handleToggleStatus(domain, checked)}
          />
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: (info) => {
        const domain = info.row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleSSL(domain)}
              title={domain.sslEnabled ? 'Disable SSL' : 'Enable SSL'}
            >
              {domain.sslEnabled ? (
                <Shield className="h-4 w-4 text-green-600" />
              ) : (
                <ShieldOff className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(domain)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(domain)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: domains,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    pageCount: paginationInfo?.totalPages || 0,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  // Event handlers
  const handleEdit = (domain: Domain) => {
    window.dispatchEvent(new CustomEvent('edit-domain', { detail: domain }));
  };

  const handleDelete = (domain: Domain) => {
    window.dispatchEvent(new CustomEvent('delete-domain', { detail: domain }));
  };

  const handleToggleSSL = (domain: Domain) => {
    window.dispatchEvent(new CustomEvent('toggle-ssl', { detail: domain }));
  };

  const handleToggleStatus = (domain: Domain, enabled: boolean) => {
    window.dispatchEvent(new CustomEvent('toggle-status', { detail: { domain, enabled } }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domains</CardTitle>
        <CardDescription>
          {paginationInfo ? `Showing ${domains.length} of ${paginationInfo.totalCount} domains` : 'Loading...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('domains.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sslFilter} onValueChange={setSslFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by SSL" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SSL</SelectItem>
              <SelectItem value="true">SSL Enabled</SelectItem>
              <SelectItem value="false">SSL Disabled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={modsecFilter} onValueChange={setModsecFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by ModSecurity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ModSecurity</SelectItem>
              <SelectItem value="true">ModSecurity Enabled</SelectItem>
              <SelectItem value="false">ModSecurity Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {paginationInfo && (
              <span>
                Page {pagination.pageIndex + 1} of {paginationInfo.totalPages} ({paginationInfo.totalCount} total)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for individual domain actions
function DomainActions() {
  const toggleSSL = useToggleDomainSSL();
  const deleteDomain = useDeleteDomain();
  const updateDomain = useUpdateDomain();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const handleDeleteDomain = async (domain: any) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Domain',
      description: `Are you sure you want to delete domain ${domain.name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDomain.mutateAsync(domain.id);
          toast.success(`Domain ${domain.name} deleted`);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete domain');
        }
      },
    });
  };

  const handleToggleSSL = async (domain: any) => {
    const newSSLStatus = !domain.sslEnabled;
    
    // Check if domain has SSL certificate when enabling
    if (newSSLStatus && !domain.sslCertificate) {
      toast.error('Cannot enable SSL: No SSL certificate found. Please issue or upload a certificate first.');
      return;
    }

    setConfirmDialog({
      open: true,
      title: `${newSSLStatus ? 'Enable' : 'Disable'} SSL`,
      description: `Are you sure you want to ${newSSLStatus ? 'enable' : 'disable'} SSL for ${domain.name}?`,
      onConfirm: async () => {
        try {
          await toggleSSL.mutateAsync({ id: domain.id, sslEnabled: newSSLStatus });
          toast.success(`SSL ${newSSLStatus ? 'enabled' : 'disabled'} for ${domain.name}`);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to toggle SSL');
        }
      },
    });
  };

  const handleToggleStatus = async ({ domain, enabled }: { domain: any; enabled: boolean }) => {
    try {
      await updateDomain.mutateAsync({ 
        id: domain.id, 
        data: { status: enabled ? 'active' : 'inactive' } 
      });
      toast.success(`Domain ${domain.name} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update domain status');
    }
  };

  useEffect(() => {
    const handleDeleteEvent = (event: CustomEvent) => {
      handleDeleteDomain(event.detail);
    };

    const handleToggleSSLEvent = (event: CustomEvent) => {
      handleToggleSSL(event.detail);
    };

    const handleToggleStatusEvent = (event: CustomEvent) => {
      handleToggleStatus(event.detail);
    };

    window.addEventListener('delete-domain', handleDeleteEvent as EventListener);
    window.addEventListener('toggle-ssl', handleToggleSSLEvent as EventListener);
    window.addEventListener('toggle-status', handleToggleStatusEvent as EventListener);

    return () => {
      window.removeEventListener('delete-domain', handleDeleteEvent as EventListener);
      window.removeEventListener('toggle-ssl', handleToggleSSLEvent as EventListener);
      window.removeEventListener('toggle-status', handleToggleStatusEvent as EventListener);
    };
  }, []);

  return (
    <ConfirmDialog
      open={confirmDialog.open}
      onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      title={confirmDialog.title}
      description={confirmDialog.description}
      onConfirm={confirmDialog.onConfirm}
      isLoading={toggleSSL.isPending || deleteDomain.isPending}
    />
  );
}

// Main Domains component
export default function Domains() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [showInstallation, setShowInstallation] = useState(false);
  
  const createDomain = useCreateDomain();
  const updateDomain = useUpdateDomain();
  const reloadNginx = useReloadNginx();
  const { data: installationStatus } = useSuspenseInstallationStatus();

  // Check if installation is needed
  useEffect(() => {
    console.log('[DOMAINS] Installation status:', installationStatus);
    if (installationStatus.step !== 'completed' && installationStatus.status !== 'success') {
      console.log('[DOMAINS] Showing installation modal because:', {
        step: installationStatus.step,
        status: installationStatus.status,
        stepNotCompleted: installationStatus.step !== 'completed',
        statusNotSuccess: installationStatus.status !== 'success'
      });
      setShowInstallation(true);
    }
  }, [installationStatus]);

  // Listen for edit-domain events from child components
  useEffect(() => {
    const handleEditDomain = (event: CustomEvent) => {
      setEditingDomain(event.detail);
      setDialogOpen(true);
    };
    
    window.addEventListener('edit-domain', handleEditDomain as EventListener);
    return () => {
      window.removeEventListener('edit-domain', handleEditDomain as EventListener);
    };
  }, []);

  const handleSave = async (domainData: any) => {
    try {
      if (editingDomain) {
        await updateDomain.mutateAsync({ id: editingDomain.id, data: domainData });
        toast.success(`Domain ${domainData.name} updated`);
      } else {
        await createDomain.mutateAsync(domainData);
        toast.success(`Domain ${domainData.name} created`);
      }
      setDialogOpen(false);
      setEditingDomain(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save domain');
    }
  };

  const handleReloadNginx = async () => {
    try {
      await reloadNginx.mutateAsync();
      toast.success('Nginx configuration reloaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reload nginx');
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('domains.title')}</h1>
              <p className="text-muted-foreground">Manage your domains and virtual hosts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReloadNginx}
              disabled={reloadNginx.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${reloadNginx.isPending ? 'animate-spin' : ''}`} />
              Reload Nginx
            </Button>
            <Button onClick={() => {
              setEditingDomain(null);
              setDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('domains.add')}
            </Button>
          </div>
        </div>

        <DomainDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingDomain(null);
          }}
          onSave={handleSave}
          domain={editingDomain}
        />

        <Suspense fallback={<SkeletonTable rows={5} columns={6} title="Domains" />}>
          <DomainsTable />
        </Suspense>

        <DomainActions />

        <InstallationProgressDialog
          open={showInstallation}
          onOpenChange={setShowInstallation}
          onComplete={() => {
            setShowInstallation(false);
            toast.success('Nginx and ModSecurity installation completed');
          }}
        />
      </div>
    </TooltipProvider>
  );
}

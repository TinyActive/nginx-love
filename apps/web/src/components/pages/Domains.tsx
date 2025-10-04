import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2, RefreshCw, Shield, ShieldOff, Globe } from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

// Component for domains table with suspense
function DomainsTable() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: domains } = useSuspenseDomains();
  
  const filteredDomains = domains.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domains</CardTitle>
        <CardDescription>
          {filteredDomains.length} of {domains.length} domains
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('domains.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('domains.name')}</TableHead>
                <TableHead>{t('domains.status')}</TableHead>
                <TableHead>{t('domains.ssl')}</TableHead>
                <TableHead>{t('domains.modsec')}</TableHead>
                <TableHead>Upstreams</TableHead>
                <TableHead className="text-right">{t('domains.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDomains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No domains found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDomains.map((domain) => (
                  <DomainRow key={domain.id} domain={domain} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for individual domain row
function DomainRow({ domain }: { domain: any }) {
  const toggleSSL = useToggleDomainSSL();
  const deleteDomain = useDeleteDomain();

  const handleEdit = (domain: any) => {
    // This will be handled by the parent component
    window.dispatchEvent(new CustomEvent('edit-domain', { detail: domain }));
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete domain ${name}?`)) return;

    try {
      await deleteDomain.mutateAsync(id);
      toast.success(`Domain ${name} deleted`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete domain');
    }
  };

  const handleToggleSSL = async (domain: any) => {
    const newSSLStatus = !domain.sslEnabled;
    
    // Check if domain has SSL certificate when enabling
    if (newSSLStatus && !domain.sslCertificate) {
      toast.error('Cannot enable SSL: No SSL certificate found. Please issue or upload a certificate first.');
      return;
    }

    try {
      await toggleSSL.mutateAsync({ id: domain.id, sslEnabled: newSSLStatus });
      toast.success(`SSL ${newSSLStatus ? 'enabled' : 'disabled'} for ${domain.name}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle SSL');
    }
  };

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

  return (
    <TableRow>
      <TableCell className="font-medium">{domain.name}</TableCell>
      <TableCell>{getStatusBadge(domain.status)}</TableCell>
      <TableCell>
        <Badge variant={domain.sslEnabled ? 'default' : 'secondary'}>
          {domain.sslEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={domain.modsecEnabled ? 'default' : 'secondary'}>
          {domain.modsecEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </TableCell>
      <TableCell>
        {domain.upstreams?.length || 0} backend{domain.upstreams?.length !== 1 ? 's' : ''}
      </TableCell>
      <TableCell className="text-right">
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
            onClick={() => handleDelete(domain.id, domain.name)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Main Domains component
export default function Domains() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<any>(null);
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

  return (
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

      <InstallationProgressDialog
        open={showInstallation}
        onOpenChange={setShowInstallation}
        onComplete={() => {
          setShowInstallation(false);
          toast.success('Nginx and ModSecurity installation completed');
        }}
      />
    </div>
  );
}

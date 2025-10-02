import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2, RefreshCw, Shield, ShieldOff } from 'lucide-react';
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
import * as domainService from '@/services/domain.service';

export default function Domains() {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<any>(null);
  const [showInstallation, setShowInstallation] = useState(false);
  const [reloading, setReloading] = useState(false);

  // Check installation status on mount
  useEffect(() => {
    checkInstallationStatus();
  }, []);

  // Load domains
  useEffect(() => {
    loadDomains();
  }, []);

  const checkInstallationStatus = async () => {
    try {
      const status = await domainService.getInstallationStatus();
      if (status.step !== 'completed' && status.status !== 'success') {
        setShowInstallation(true);
      }
    } catch (error) {
      console.error('Failed to check installation status:', error);
    }
  };

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await domainService.getDomains();
      setDomains(data);
    } catch (error: any) {
      console.error('Failed to load domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (domainData: any) => {
    try {
      if (editingDomain) {
        await domainService.updateDomain(editingDomain.id, domainData);
        toast.success(`Domain ${domainData.name} updated`);
      } else {
        await domainService.createDomain(domainData);
        toast.success(`Domain ${domainData.name} created`);
      }
      loadDomains();
      setDialogOpen(false);
      setEditingDomain(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save domain');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete domain ${name}?`)) return;

    try {
      await domainService.deleteDomain(id);
      toast.success(`Domain ${name} deleted`);
      loadDomains();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete domain');
    }
  };

  const handleEdit = (domain: any) => {
    setEditingDomain(domain);
    setDialogOpen(true);
  };

  const handleToggleSSL = async (domain: any) => {
    const newSSLStatus = !domain.sslEnabled;
    
    // Check if domain has SSL certificate when enabling
    if (newSSLStatus && !domain.sslCertificate) {
      toast.error('Cannot enable SSL: No SSL certificate found. Please issue or upload a certificate first.');
      return;
    }

    try {
      await domainService.toggleSSL(domain.id, newSSLStatus);
      toast.success(`SSL ${newSSLStatus ? 'enabled' : 'disabled'} for ${domain.name}`);
      loadDomains();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle SSL');
    }
  };

  const handleReloadNginx = async () => {
    try {
      setReloading(true);
      await domainService.reloadNginx();
      toast.success('Nginx configuration reloaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reload nginx');
    } finally {
      setReloading(false);
    }
  };

  const handleInstallationComplete = () => {
    setShowInstallation(false);
    toast.success('Nginx and ModSecurity installation completed');
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('domains.title')}</h1>
          <p className="text-muted-foreground">Manage your domains and virtual hosts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReloadNginx}
            disabled={reloading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${reloading ? 'animate-spin' : ''}`} />
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

      <InstallationProgressDialog
        open={showInstallation}
        onOpenChange={setShowInstallation}
        onComplete={handleInstallationComplete}
      />

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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredDomains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No domains found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDomains.map((domain) => (
                    <TableRow key={domain.id}>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

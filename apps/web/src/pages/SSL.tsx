import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Plus, AlertTriangle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { SSLDialog } from '@/components/ssl/SSLDialog';
import { sslService } from '@/services/ssl.service';
import { SSLCertificate } from '@/types';
import { toast } from 'sonner';
import { SkeletonStatsCard, SkeletonTable } from '@/components/ui/skeletons';

export default function SSL() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [certificates, setCertificates] = useState<SSLCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await sslService.getAll();
      setCertificates(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (id: string) => {
    try {
      setRenewingId(id);
      await sslService.renew(id);
      toast.success('Certificate renewed successfully');
      await loadCertificates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to renew certificate');
    } finally {
      setRenewingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    try {
      await sslService.delete(id);
      toast.success('Certificate deleted successfully');
      await loadCertificates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete certificate');
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'valid') {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    return <AlertTriangle className="h-4 w-4 text-warning" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      valid: 'default' as const,
      expiring: 'default' as const,
      expired: 'destructive' as const
    };
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('nav.ssl')}</h1>
            <p className="text-muted-foreground">Manage SSL/TLS certificates</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Certificate
        </Button>
      </div>

      <SSLDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadCertificates}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{certificates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valid</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {certificates.filter(c => c.status === 'valid').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {certificates.filter(c => c.status === 'expiring').length}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SSL Certificates</CardTitle>
          <CardDescription>
            View and manage SSL/TLS certificates for your domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable rows={5} columns={7} showCard={false} />
          ) : certificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No SSL certificates found. Add one to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Issuer</TableHead>
                    <TableHead>Valid From</TableHead>
                    <TableHead>Valid To</TableHead>
                    <TableHead>Auto Renew</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(cert.status)}
                          {cert.domain?.name || cert.commonName}
                        </div>
                      </TableCell>
                      <TableCell>{cert.issuer}</TableCell>
                      <TableCell>{formatDate(cert.validFrom)}</TableCell>
                      <TableCell>{formatDate(cert.validTo)}</TableCell>
                      <TableCell>
                        <Badge variant={cert.autoRenew ? 'default' : 'secondary'}>
                          {cert.autoRenew ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {cert.issuer === "Let's Encrypt" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRenew(cert.id)}
                              disabled={renewingId === cert.id}
                            >
                              {renewingId === cert.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Renew
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(cert.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

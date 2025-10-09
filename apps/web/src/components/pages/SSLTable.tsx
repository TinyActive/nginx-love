import { useState } from 'react';
import { useSuspenseSSLCertificates } from '@/queries/ssl.query-options';
import { useRenewSSLCertificate, useDeleteSSLCertificate } from '@/queries/ssl.query-options';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function SSLTable() {
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const { data: certificates } = useSuspenseSSLCertificates();
  const renewMutation = useRenewSSLCertificate();
  const deleteMutation = useDeleteSSLCertificate();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    certificateId: string;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    certificateId: '',
  });

  const handleRenew = async (id: string) => {
    try {
      setRenewingId(id);
      await renewMutation.mutateAsync(id);
      toast.success('Certificate renewed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to renew certificate');
    } finally {
      setRenewingId(null);
    }
  };

  const handleDelete = (id: string, domainName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete SSL Certificate',
      description: `Are you sure you want to delete the SSL certificate for ${domainName}? This action cannot be undone.`,
      certificateId: id,
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(id);
          toast.success('Certificate deleted successfully');
          setConfirmDialog(prev => ({ ...prev, open: false }));
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to delete certificate');
        }
      },
    });
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
    <Card>
      <CardHeader>
        <CardTitle>SSL Certificates</CardTitle>
        <CardDescription>
          View and manage SSL/TLS certificates for your domains
        </CardDescription>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              No SSL certificates found. Add one to get started.
            </div>
            <div className="text-sm text-muted-foreground">
              You can issue a free Let's Encrypt certificate or upload a manual certificate for your domains.
            </div>
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
                          onClick={() => handleDelete(cert.id, cert.domain?.name || cert.commonName)}
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
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </Card>
  );
}
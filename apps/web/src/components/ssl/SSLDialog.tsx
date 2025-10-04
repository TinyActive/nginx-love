import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Domain } from '@/types';
import { toast } from 'sonner';
import { useIssueAutoSSL, useUploadManualSSL, useDomains } from '@/queries';

interface SSLDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SSLDialog({ open, onOpenChange, onSuccess }: SSLDialogProps) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<'auto' | 'manual'>('auto');
  const [formData, setFormData] = useState({
    domainId: '',
    email: '',
    autoRenew: true,
    certificate: '',
    privateKey: '',
    chain: '',
  });

  // Use TanStack Query to fetch domains
  const { data: domainsResponse, isLoading: domainsLoading, error: domainsError } = useDomains();
  
  // Filter domains without SSL certificate
  const domainsWithoutSSL = domainsResponse?.data?.filter(d => !d.sslEnabled) || [];

  const issueAutoSSL = useIssueAutoSSL();
  const uploadManualSSL = useUploadManualSSL();

  // Show error toast if domains fail to load
  useEffect(() => {
    if (domainsError) {
      toast.error('Failed to load domains');
    }
  }, [domainsError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.domainId) {
      toast.error('Please select a domain');
      return;
    }

    if (method === 'manual') {
      if (!formData.certificate || !formData.privateKey) {
        toast.error('Certificate and private key are required');
        return;
      }
    }

    try {
      if (method === 'auto') {
        await issueAutoSSL.mutateAsync({
          domainId: formData.domainId,
          email: formData.email || undefined,
          autoRenew: formData.autoRenew,
        });
        toast.success("Let's Encrypt certificate issued successfully");
      } else {
        await uploadManualSSL.mutateAsync({
          domainId: formData.domainId,
          certificate: formData.certificate,
          privateKey: formData.privateKey,
          chain: formData.chain || undefined,
        });
        toast.success('SSL certificate uploaded successfully');
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        domainId: '',
        email: '',
        autoRenew: true,
        certificate: '',
        privateKey: '',
        chain: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add certificate');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add SSL Certificate</DialogTitle>
          <DialogDescription>
            Configure SSL/TLS certificate for your domain
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain *</Label>
            <Select
              value={formData.domainId}
              onValueChange={(value) => setFormData({ ...formData, domainId: value })}
              disabled={domainsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={domainsLoading ? "Loading domains..." : "Select a domain"} />
              </SelectTrigger>
              <SelectContent>
                {domainsWithoutSSL.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No domains available without SSL
                  </SelectItem>
                ) : (
                  domainsWithoutSSL.map((domain: Domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={method} onValueChange={(v) => setMethod(v as 'auto' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Auto (Let's Encrypt)</TabsTrigger>
              <TabsTrigger value="manual">Manual Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="space-y-4">
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <h4 className="font-medium mb-2">Let's Encrypt Auto-SSL</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically obtain and renew SSL certificates from Let's Encrypt.
                  Certificates will be issued within minutes and auto-renewed before expiry.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Email for expiry notifications
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoRenew">Auto-Renewal</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically renew before expiration
                  </p>
                </div>
                <Switch
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked })}
                />
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Requirements:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Domain must point to this server's IP</li>
                  <li>Port 80 must be accessible for validation</li>
                  <li>Valid domain name (no wildcards)</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificate">Certificate (PEM) *</Label>
                <Textarea
                  id="certificate"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={formData.certificate}
                  onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                  rows={6}
                  className="font-mono text-xs"
                  required={method === 'manual'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key (PEM) *</Label>
                <Textarea
                  id="privateKey"
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  value={formData.privateKey}
                  onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                  rows={6}
                  className="font-mono text-xs"
                  required={method === 'manual'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chain">Certificate Chain (Optional)</Label>
                <Textarea
                  id="chain"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={formData.chain}
                  onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={issueAutoSSL.isPending || uploadManualSSL.isPending}>
              {issueAutoSSL.isPending || uploadManualSSL.isPending ? 'Adding...' : 'Add Certificate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

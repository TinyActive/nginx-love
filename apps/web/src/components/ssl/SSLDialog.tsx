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
import { useIssueAutoSSL, useUploadManualSSL, useUploadWildcardSSL, useIssueWildcardSSL, useDomains } from '@/queries';

interface SSLDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SSLDialog({ open, onOpenChange, onSuccess }: SSLDialogProps) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<'auto' | 'manual' | 'wildcard' | 'wildcard-auto'>('auto');
  const [formData, setFormData] = useState({
    domainId: '',
    email: '',
    autoRenew: true,
    certificate: '',
    privateKey: '',
    chain: '',
  });
  // Extra state for wildcard multi-domain selection
  const [wcExtraDomainIds, setWcExtraDomainIds] = useState<string[]>([]);
  // Cloudflare DNS credentials for wildcard auto-SSL
  const [cfCredentialMode, setCfCredentialMode] = useState<'token' | 'key'>('token');
  const [cfCredentials, setCfCredentials] = useState({
    cfToken: '',
    cfAccountId: '',
    cfApiKey: '',
    cfApiEmail: '',
  });
  const [wcBaseDomain, setWcBaseDomain] = useState('');

  // Use TanStack Query to fetch domains
  const { data: domainsResponse, isLoading: domainsLoading, error: domainsError } = useDomains();
  
  // Filter domains without SSL certificate - check both sslCertificate object and sslEnabled flag
  const domainsWithoutSSL = domainsResponse?.data?.filter(d => !d.sslCertificate && !d.sslEnabled) || [];

  const issueAutoSSL = useIssueAutoSSL();
  const uploadManualSSL = useUploadManualSSL();
  const uploadWildcardSSL = useUploadWildcardSSL();
  const issueWildcardSSL = useIssueWildcardSSL();

  // Toggle a domain ID in the wildcard extra-domains set
  const toggleWcDomain = (domainId: string) => {
    setWcExtraDomainIds(prev =>
      prev.includes(domainId) ? prev.filter(id => id !== domainId) : [...prev, domainId]
    );
  };

  // Show error toast if domains fail to load
  useEffect(() => {
    if (domainsError) {
      toast.error('Failed to load domains');
    }
  }, [domainsError]);

  // Validate certificate format and structure
  const validateCertificate = (cert: string, type: 'certificate' | 'privateKey' | 'chain'): { valid: boolean; error?: string } => {
    if (!cert.trim()) {
      return { valid: false, error: `${type} is empty` };
    }

    // Define expected PEM headers/footers
    const patterns = {
      certificate: {
        begin: '-----BEGIN CERTIFICATE-----',
        end: '-----END CERTIFICATE-----',
        name: 'Certificate'
      },
      privateKey: {
        begin: /-----BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY-----/,
        end: /-----END (RSA |EC |ENCRYPTED )?PRIVATE KEY-----/,
        name: 'Private Key'
      },
      chain: {
        begin: '-----BEGIN CERTIFICATE-----',
        end: '-----END CERTIFICATE-----',
        name: 'Certificate Chain'
      }
    };

    const pattern = patterns[type];
    
    // Check for BEGIN marker
    const hasBegin = pattern.begin instanceof RegExp 
      ? pattern.begin.test(cert)
      : cert.includes(pattern.begin);
    
    if (!hasBegin) {
      return { valid: false, error: `${pattern.name} must start with proper PEM header` };
    }

    // Check for END marker
    const hasEnd = pattern.end instanceof RegExp
      ? pattern.end.test(cert)
      : cert.includes(pattern.end);
    
    if (!hasEnd) {
      return { valid: false, error: `${pattern.name} must end with proper PEM footer` };
    }

    // Check for suspicious content (basic XSS/injection prevention)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // event handlers like onclick=
      /<iframe/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
    ];

    for (const suspicious of suspiciousPatterns) {
      if (suspicious.test(cert)) {
        return { valid: false, error: `${pattern.name} contains suspicious content` };
      }
    }

    // Validate base64 content between headers
    const base64Pattern = /^[A-Za-z0-9+/=\s\r\n-]+$/;
    const lines = cert.split('\n').filter(line => 
      !line.includes('-----BEGIN') && 
      !line.includes('-----END') &&
      line.trim() !== ''
    );
    
    for (const line of lines) {
      if (!base64Pattern.test(line.trim())) {
        return { valid: false, error: `${pattern.name} contains invalid characters (expected base64)` };
      }
    }

    return { valid: true };
  };

  // Validate domain name matches certificate
  const validateDomainMatch = async (domainName: string, certificate: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      // This is a basic client-side check - backend will do comprehensive validation
      // For wildcard certificates (*.example.com), the domain name might not appear literally
      
      // Normalize certificate content (remove extra whitespace, newlines for easier matching)
      const certContent = certificate.toLowerCase().replace(/\s+/g, ' ');
      const domain = domainName.toLowerCase();
      
      // Check for exact match
      if (certContent.includes(domain)) {
        console.log(`✅ Domain match found: exact match "${domain}"`);
        return { valid: true };
      }

      // Check for wildcard certificate
      // Example: *.nginxwaf.me should match dev.nginxwaf.me
      const domainParts = domain.split('.');
      if (domainParts.length >= 2) {
        // Build wildcard patterns to check
        const wildcardPatterns: string[] = [];
        
        // Check parent domain wildcard: dev.nginxwaf.me -> *.nginxwaf.me
        const parentDomain = domainParts.slice(1).join('.');
        const mainWildcard = `*.${parentDomain}`;
        wildcardPatterns.push(mainWildcard);
        
        // Also check without spaces (some certs may have *.domain format)
        wildcardPatterns.push(`*${parentDomain}`); // *domain.com
        wildcardPatterns.push(`* ${parentDomain}`); // * domain.com
        
        // Check all possible wildcard levels
        for (let i = 1; i < domainParts.length; i++) {
          const wildcardDomain = `*.${domainParts.slice(i).join('.')}`;
          wildcardPatterns.push(wildcardDomain);
        }
        
        console.log(`🔍 Searching for patterns in certificate:`, wildcardPatterns);
        
        // Check if any wildcard pattern exists in certificate
        for (const pattern of wildcardPatterns) {
          if (certContent.includes(pattern)) {
            console.log(`✅ Wildcard match found: "${pattern}"`);
            return { valid: true };
          }
        }
        
        console.log(`⚠️ No match found for domain "${domain}"`);
      }

      // If no match found, just return valid=true and skip the warning
      // Let backend do the real validation - this is just a sanity check
      // CloudFlare Origin Certificates often have CN that doesn't match, but SANs do
      console.log(`ℹ️ Client-side validation inconclusive, deferring to backend for "${domain}"`);
      return { valid: true }; // Changed from false to true - always allow and let backend validate
      
    } catch (error) {
      console.log(`ℹ️ Client-side validation error, deferring to backend:`, error);
      return { valid: true }; // Allow if parsing fails - backend will validate
    }
  };

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

      // Validate certificate format
      const certValidation = validateCertificate(formData.certificate, 'certificate');
      if (!certValidation.valid) {
        toast.error(certValidation.error || 'Invalid certificate format');
        return;
      }

      // Validate private key format
      const keyValidation = validateCertificate(formData.privateKey, 'privateKey');
      if (!keyValidation.valid) {
        toast.error(keyValidation.error || 'Invalid private key format');
        return;
      }

      // Validate chain if provided
      if (formData.chain && formData.chain.trim()) {
        const chainValidation = validateCertificate(formData.chain, 'chain');
        if (!chainValidation.valid) {
          toast.error(chainValidation.error || 'Invalid certificate chain format');
          return;
        }
      }

      // Validate domain match
      const selectedDomain = domainsResponse?.data?.find(d => d.id === formData.domainId);
      if (selectedDomain) {
        const domainMatchValidation = await validateDomainMatch(selectedDomain.name, formData.certificate);
        if (!domainMatchValidation.valid) {
          toast.warning(domainMatchValidation.error || 'Domain validation warning');
          // Note: We show warning but allow to continue - backend will do final validation
        }
      }
    }

    try {
      if (method === 'auto') {
        await issueAutoSSL.mutateAsync({
          domainId: formData.domainId,
          email: formData.email || undefined,
          autoRenew: formData.autoRenew,
        });
        toast.success("SSL certificate issued successfully (ZeroSSL)");
      } else if (method === 'wildcard-auto') {
        if (!wcBaseDomain) {
          toast.error('Base domain is required (e.g., example.com)');
          return;
        }
        // Build Cloudflare DNS credentials
        const dnsCredentials: Record<string, string> = {};
        if (cfCredentialMode === 'token') {
          if (!cfCredentials.cfToken) {
            toast.error('Cloudflare API Token is required');
            return;
          }
          dnsCredentials['CF_Token'] = cfCredentials.cfToken;
          if (cfCredentials.cfAccountId) {
            dnsCredentials['CF_Account_ID'] = cfCredentials.cfAccountId;
          }
        } else {
          if (!cfCredentials.cfApiKey || !cfCredentials.cfApiEmail) {
            toast.error('Cloudflare Global API Key and Email are both required');
            return;
          }
          dnsCredentials['CF_Key'] = cfCredentials.cfApiKey;
          dnsCredentials['CF_Email'] = cfCredentials.cfApiEmail;
        }
        await issueWildcardSSL.mutateAsync({
          domainId: formData.domainId,
          baseDomain: wcBaseDomain,
          email: formData.email || undefined,
          dnsProvider: 'dns_cf',
          dnsCredentials,
          autoRenew: formData.autoRenew,
        });
        toast.success('Wildcard SSL certificate issued via Cloudflare DNS');
      } else if (method === 'wildcard') {
        await uploadWildcardSSL.mutateAsync({
          domainId: formData.domainId,
          certificate: formData.certificate,
          privateKey: formData.privateKey,
          chain: formData.chain || undefined,
          additionalDomainIds: wcExtraDomainIds.length > 0 ? wcExtraDomainIds : undefined,
        });
        toast.success('Wildcard SSL certificate uploaded and applied');
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
      setWcExtraDomainIds([]);
      setCfCredentials({ cfToken: '', cfAccountId: '', cfApiKey: '', cfApiEmail: '' });
      setWcBaseDomain('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add certificate');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
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

          <Tabs value={method} onValueChange={(v) => setMethod(v as 'auto' | 'manual' | 'wildcard' | 'wildcard-auto')}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="auto">Auto (ZeroSSL)</TabsTrigger>
              <TabsTrigger value="manual">Manual Upload</TabsTrigger>
              <TabsTrigger value="wildcard">Wildcard Upload</TabsTrigger>
              <TabsTrigger value="wildcard-auto">Wildcard Auto</TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="space-y-4">
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <h4 className="font-medium mb-2">ZeroSSL/Let's Encrypt Auto-SSL</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically obtain and renew SSL certificates from ZeroSSL or Let's Encrypt.
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
                  className="font-mono text-xs break-all whitespace-pre-wrap max-h-[100px]"
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
                  className="font-mono text-xs break-all whitespace-pre-wrap max-h-[100px]"
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
                  className="font-mono text-xs break-all whitespace-pre-wrap max-h-[150px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="wildcard" className="space-y-4">
              <div className="rounded-lg bg-amber-500/10 p-4 border border-amber-500/20">
                <h4 className="font-medium mb-2">Wildcard Certificate (*.domain.com)</h4>
                <p className="text-sm text-muted-foreground">
                  Upload a wildcard certificate that covers all subdomains under a parent domain.
                  You can apply it to multiple domains at once. The server validates that each
                  selected domain actually falls within the wildcard scope.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wcCert">Wildcard Certificate (PEM) *</Label>
                <Textarea
                  id="wcCert"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={formData.certificate}
                  onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                  rows={5}
                  className="font-mono text-xs break-all whitespace-pre-wrap max-h-[100px]"
                  required={method === 'wildcard'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wcKey">Private Key (PEM) *</Label>
                <Textarea
                  id="wcKey"
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  value={formData.privateKey}
                  onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                  rows={5}
                  className="font-mono text-xs break-all whitespace-pre-wrap max-h-[100px]"
                  required={method === 'wildcard'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wcChain">Chain (Optional)</Label>
                <Textarea
                  id="wcChain"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={formData.chain}
                  onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                  rows={3}
                  className="font-mono text-xs break-all whitespace-pre-wrap max-h-[80px]"
                />
              </div>

              {/* Multi-domain selector: pick extra domains to apply this wildcard to */}
              {domainsWithoutSSL.length > 1 && formData.domainId && (
                <div className="space-y-2">
                  <Label>Also apply to these domains (optional)</Label>
                  <div className="grid gap-2 max-h-[120px] overflow-y-auto rounded-md border p-2">
                    {domainsWithoutSSL
                      .filter(d => d.id !== formData.domainId)
                      .map((d: Domain) => (
                        <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wcExtraDomainIds.includes(d.id)}
                            onChange={() => toggleWcDomain(d.id)}
                            className="rounded border-gray-300"
                          />
                          {d.name}
                        </label>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected domains must be subdomains covered by the wildcard pattern.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="wildcard-auto" className="space-y-4">
              <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                <h4 className="font-medium mb-2">Wildcard Auto-SSL via Cloudflare DNS</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically issue a wildcard certificate (*.domain.com) using ZeroSSL/Let's Encrypt
                  with Cloudflare DNS-01 challenge. Your Cloudflare credentials will be saved for auto-renewal.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wcBaseDomain">Base Domain *</Label>
                <Input
                  id="wcBaseDomain"
                  placeholder="example.com"
                  value={wcBaseDomain}
                  onChange={(e) => setWcBaseDomain(e.target.value)}
                  required={method === 'wildcard-auto'}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the parent domain. Certificate will cover *.example.com and example.com
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wcAutoEmail">Email (Optional)</Label>
                <Input
                  id="wcAutoEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Email for certificate expiry notifications
                </p>
              </div>

              <div className="space-y-3">
                <Label>Cloudflare Authentication Method</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="cfCredentialMode"
                      checked={cfCredentialMode === 'token'}
                      onChange={() => setCfCredentialMode('token')}
                      className="rounded border-gray-300"
                    />
                    API Token (Recommended)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="cfCredentialMode"
                      checked={cfCredentialMode === 'key'}
                      onChange={() => setCfCredentialMode('key')}
                      className="rounded border-gray-300"
                    />
                    Global API Key
                  </label>
                </div>
              </div>

              {cfCredentialMode === 'token' ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cfToken">Cloudflare API Token *</Label>
                    <Input
                      id="cfToken"
                      type="password"
                      placeholder="Enter your Cloudflare API Token"
                      value={cfCredentials.cfToken}
                      onChange={(e) => setCfCredentials({ ...cfCredentials, cfToken: e.target.value })}
                      required={method === 'wildcard-auto' && cfCredentialMode === 'token'}
                    />
                    <p className="text-xs text-muted-foreground">
                      Create a token with Zone:DNS:Edit permission at Cloudflare Dashboard → API Tokens
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfAccountId">Cloudflare Account ID (Optional)</Label>
                    <Input
                      id="cfAccountId"
                      placeholder="Enter your Cloudflare Account ID"
                      value={cfCredentials.cfAccountId}
                      onChange={(e) => setCfCredentials({ ...cfCredentials, cfAccountId: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cfApiKey">Global API Key *</Label>
                    <Input
                      id="cfApiKey"
                      type="password"
                      placeholder="Enter your Cloudflare Global API Key"
                      value={cfCredentials.cfApiKey}
                      onChange={(e) => setCfCredentials({ ...cfCredentials, cfApiKey: e.target.value })}
                      required={method === 'wildcard-auto' && cfCredentialMode === 'key'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfApiEmail">Cloudflare Account Email *</Label>
                    <Input
                      id="cfApiEmail"
                      type="email"
                      placeholder="your-email@example.com"
                      value={cfCredentials.cfApiEmail}
                      onChange={(e) => setCfCredentials({ ...cfCredentials, cfApiEmail: e.target.value })}
                      required={method === 'wildcard-auto' && cfCredentialMode === 'key'}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="wcAutoRenew">Auto-Renewal</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically renew using saved Cloudflare credentials
                  </p>
                </div>
                <Switch
                  id="wcAutoRenew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked })}
                />
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Requirements:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Domain DNS must be managed by Cloudflare</li>
                  <li>Valid Cloudflare API Token with Zone:DNS:Edit permission</li>
                  <li>Credentials will be stored securely for auto-renewal</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={issueAutoSSL.isPending || uploadManualSSL.isPending || uploadWildcardSSL.isPending || issueWildcardSSL.isPending}>
              {(issueAutoSSL.isPending || uploadManualSSL.isPending || uploadWildcardSSL.isPending || issueWildcardSSL.isPending) ? 'Adding...' : 'Add Certificate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

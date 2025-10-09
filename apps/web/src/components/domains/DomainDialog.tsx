import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Domain } from '@/types';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface UpstreamFormData {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  sslVerify: boolean;
  weight: number;
  maxFails: number;
  failTimeout: number;
}

interface DomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: Domain | null;
  onSave: (domain: any) => void;
}

export function DomainDialog({ open, onOpenChange, domain, onSave }: DomainDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive' | 'error',
    sslEnabled: false,
    modsecEnabled: false,
    lbAlgorithm: 'round_robin' as 'round_robin' | 'least_conn' | 'ip_hash',
    healthCheckEnabled: false,
    healthCheckPath: '/health',
    healthCheckInterval: 30,
    healthCheckTimeout: 5,
    realIpEnabled: false,
    realIpCloudflare: false,
  });

  const [upstreams, setUpstreams] = useState<UpstreamFormData[]>([
    {
      host: '',
      port: 80,
      protocol: 'http' as 'http' | 'https',
      sslVerify: true,
      weight: 1,
      maxFails: 3,
      failTimeout: 30,
    },
  ]);

  // Reset form when dialog opens or domain changes
  useEffect(() => {
    if (open) {
      if (domain) {
        // Edit mode - populate from domain
        setFormData({
          name: domain.name || '',
          status: domain.status || 'active',
          sslEnabled: domain.sslEnabled || false,
          modsecEnabled: domain.modsecEnabled || false,
          lbAlgorithm: (domain.loadBalancer?.algorithm || 'round_robin') as 'round_robin' | 'least_conn' | 'ip_hash',
          healthCheckEnabled: domain.loadBalancer?.healthCheckEnabled || false,
          healthCheckPath: domain.loadBalancer?.healthCheckPath || '/health',
          healthCheckInterval: domain.loadBalancer?.healthCheckInterval || 30,
          healthCheckTimeout: domain.loadBalancer?.healthCheckTimeout || 5,
          realIpEnabled: (domain as any).realIpEnabled || false,
          realIpCloudflare: (domain as any).realIpCloudflare || false,
          realIpEnabled: domain?.realIpEnabled || false,
          realIpCloudflare: domain?.realIpCloudflare || false,
        });
        
        // Populate upstreams
        if (domain.upstreams && domain.upstreams.length > 0) {
          setUpstreams(domain.upstreams.map(u => ({
            host: u.host,
            port: u.port,
            protocol: u.protocol || 'http',
            sslVerify: u.sslVerify !== undefined ? u.sslVerify : true,
            weight: u.weight,
            maxFails: u.maxFails,
            failTimeout: u.failTimeout,
          })));
        }
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          status: 'active',
          sslEnabled: false,
          modsecEnabled: false,
          lbAlgorithm: 'round_robin',
          healthCheckEnabled: true,
          healthCheckPath: '/health',
          healthCheckInterval: 30,
          healthCheckTimeout: 5,
          realIpEnabled: false,
          realIpCloudflare: false,
        });
        setUpstreams([
          {
            host: '',
            port: 80,
            protocol: 'http',
            sslVerify: true,
            weight: 1,
            maxFails: 3,
            failTimeout: 30,
          },
        ]);
      }
    }
  }, [open, domain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Domain name is required');
      return;
    }

    if (upstreams.length === 0) {
      toast.error('At least one upstream backend is required');
      return;
    }

    // Validate all upstreams have host
    const invalidUpstream = upstreams.find(u => !u.host);
    if (invalidUpstream) {
      toast.error('All upstream backends must have a host');
      return;
    }

    // Prepare data in API format
    const domainData = {
      name: formData.name,
      status: formData.status,
      modsecEnabled: formData.modsecEnabled,
      // NOTE: sslEnabled is NOT sent here - use toggleSSL API instead
      upstreams: upstreams.map(u => ({
        host: u.host,
        port: u.port,
        protocol: u.protocol,
        sslVerify: u.sslVerify,
        weight: u.weight,
        maxFails: u.maxFails,
        failTimeout: u.failTimeout,
      })),
      loadBalancer: {
        algorithm: formData.lbAlgorithm,
        healthCheckEnabled: formData.healthCheckEnabled,
        healthCheckInterval: formData.healthCheckInterval,
        healthCheckTimeout: formData.healthCheckTimeout,
        healthCheckPath: formData.healthCheckPath,
      },
      realIpConfig: {
        realIpEnabled: formData.realIpEnabled,
        realIpCloudflare: formData.realIpCloudflare,
        realIpCustomCidrs: [],
      },
    };

    onSave(domainData);
    onOpenChange(false);
  };

  const addUpstream = () => {
    setUpstreams([
      ...upstreams,
      {
        host: '',
        port: 80,
        protocol: 'http',
        sslVerify: true,
        weight: 1,
        maxFails: 3,
        failTimeout: 30,
      },
    ]);
  };

  const removeUpstream = (index: number) => {
    if (upstreams.length > 1) {
      setUpstreams(upstreams.filter((_, i) => i !== index));
    } else {
      toast.error('At least one upstream backend is required');
    }
  };

  const updateUpstream = (index: number, field: keyof UpstreamFormData, value: any) => {
    const newUpstreams = [...upstreams];
    newUpstreams[index] = { ...newUpstreams[index], [field]: value };
    setUpstreams(newUpstreams);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{domain ? 'Edit Domain' : 'Add New Domain'}</DialogTitle>
          <DialogDescription>
            Configure domain and upstream backend settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Domain Name *</Label>
            <Input
              id="name"
              placeholder="example.com"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'error' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lbAlgorithm">Load Balancer Algorithm</Label>
              <Select
                value={formData.lbAlgorithm}
                onValueChange={(value) => setFormData({ ...formData, lbAlgorithm: value as 'round_robin' | 'least_conn' | 'ip_hash' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="least_conn">Least Connections</SelectItem>
                  <SelectItem value="ip_hash">IP Hash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Upstream Backends</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUpstream}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Backend
              </Button>
            </div>

            <div className="space-y-4">
              {upstreams.map((upstream, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Backend #{index + 1}</span>
                    {upstreams.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpstream(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Host *</Label>
                      <Input
                        placeholder="10.0.1.10"
                        value={upstream.host}
                        onChange={(e) => updateUpstream(index, 'host', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input
                        type="number"
                        placeholder="80"
                        value={upstream.port}
                        onChange={(e) =>
                          updateUpstream(index, 'port', parseInt(e.target.value) || 80)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Protocol</Label>
                      <Select
                        value={upstream.protocol}
                        onValueChange={(value) =>
                          updateUpstream(index, 'protocol', value as 'http' | 'https')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="http">HTTP</SelectItem>
                          <SelectItem value="https">HTTPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {upstream.protocol === 'https' && (
                    <div className="flex items-center justify-between bg-muted/50 p-3 rounded">
                      <div>
                        <Label>Disable SSL Verification</Label>
                        <p className="text-xs text-muted-foreground">
                          Skip backend certificate validation (proxy_ssl_verify off)
                        </p>
                      </div>
                      <Switch
                        checked={!upstream.sslVerify}
                        onCheckedChange={(checked) =>
                          updateUpstream(index, 'sslVerify', !checked)
                        }
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Weight</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={upstream.weight}
                        onChange={(e) =>
                          updateUpstream(index, 'weight', parseInt(e.target.value) || 1)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Fails</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={upstream.maxFails}
                        onChange={(e) =>
                          updateUpstream(index, 'maxFails', parseInt(e.target.value) || 3)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fail Timeout (s)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="300"
                        value={upstream.failTimeout}
                        onChange={(e) =>
                          updateUpstream(index, 'failTimeout', parseInt(e.target.value) || 30)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Security & Features</h4>
            
            {/* SSL is managed separately via Toggle SSL button in Domains page */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>SSL/TLS Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.sslEnabled ? '✅ Enabled' : '⚠️ Disabled - Use Toggle SSL button in Domains page'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="modsec">Enable ModSecurity</Label>
                <p className="text-sm text-muted-foreground">
                  Activate WAF protection
                </p>
              </div>
              <Switch
                id="modsec"
                checked={formData.modsecEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, modsecEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="realIp">Enable Real IP Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Get real client IP from proxy headers
                </p>
              </div>
              <Switch
                id="realIp"
                checked={formData.realIpEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, realIpEnabled: checked })
                }
              />
            </div>

            {formData.realIpEnabled && (
              <div className="space-y-4 ml-4 border-l-2 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="cloudflare">Use Cloudflare IP Ranges</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically trust all Cloudflare IPs
                    </p>
                  </div>
                  <Switch
                    id="cloudflare"
                    checked={formData.realIpCloudflare}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, realIpCloudflare: checked })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="healthCheck">Enable Health Checks</Label>
                <p className="text-sm text-muted-foreground">
                  Monitor backend availability
                </p>
              </div>
              <Switch
                id="healthCheck"
                checked={formData.healthCheckEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, healthCheckEnabled: checked })
                }
              />
            </div>

            {formData.healthCheckEnabled && (
              <div className="space-y-4 ml-4 border-l-2 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="healthCheckPath">Health Check Path</Label>
                  <Input
                    id="healthCheckPath"
                    placeholder="/health"
                    value={formData.healthCheckPath}
                    onChange={(e) =>
                      setFormData({ ...formData, healthCheckPath: e.target.value })
                    }
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="healthCheckInterval">Interval (seconds)</Label>
                    <Input
                      id="healthCheckInterval"
                      type="number"
                      min="1"
                      max="300"
                      value={formData.healthCheckInterval}
                      onChange={(e) =>
                        setFormData({ ...formData, healthCheckInterval: parseInt(e.target.value) || 30 })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="healthCheckTimeout">Timeout (seconds)</Label>
                    <Input
                      id="healthCheckTimeout"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.healthCheckTimeout}
                      onChange={(e) =>
                        setFormData({ ...formData, healthCheckTimeout: parseInt(e.target.value) || 5 })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {domain ? 'Update Domain' : 'Create Domain'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

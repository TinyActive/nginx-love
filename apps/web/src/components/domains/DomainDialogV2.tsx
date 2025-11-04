import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Trash2, HelpCircle, Shield, Server, Settings, RefreshCw } from 'lucide-react';
import { Domain } from '@/types';
import { toast } from 'sonner';

interface UpstreamFormData {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  sslVerify: boolean;
  weight: number;
  maxFails: number;
  failTimeout: number;
}

interface CustomLocationFormData {
  path: string;
  upstreamType: 'proxy_pass' | 'grpc_pass' | 'grpcs_pass';
  upstreams: UpstreamFormData[];
  config?: string;
}

interface FormData {
  // Basic
  name: string;
  status: 'active' | 'inactive' | 'error';
  lbAlgorithm: 'round_robin' | 'least_conn' | 'ip_hash';
  upstreams: UpstreamFormData[];
  
  // Security
  modsecEnabled: boolean;
  autoCreateSSL: boolean;
  sslEmail: string;
  realIpEnabled: boolean;
  realIpCloudflare: boolean;
  healthCheckEnabled: boolean;
  healthCheckPath: string;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  
  // Advanced
  hstsEnabled: boolean;
  http2Enabled: boolean;
  grpcEnabled: boolean;
  clientMaxBodySize: number;
  customLocations: CustomLocationFormData[];
}

interface DomainDialogV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: Domain | null;
  onSave: (domain: any) => void;
  isLoading?: boolean;
}

export function DomainDialogV2({ open, onOpenChange, domain, onSave, isLoading = false }: DomainDialogV2Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      status: 'active',
      lbAlgorithm: 'round_robin',
      upstreams: [{ host: '', port: 80, protocol: 'http', sslVerify: true, weight: 1, maxFails: 3, failTimeout: 30 }],
      modsecEnabled: true,
      autoCreateSSL: false,
      sslEmail: '',
      realIpEnabled: false,
      realIpCloudflare: false,
      healthCheckEnabled: true,
      healthCheckPath: '/health',
      healthCheckInterval: 30,
      healthCheckTimeout: 5,
      hstsEnabled: false,
      http2Enabled: true,
      grpcEnabled: false,
      clientMaxBodySize: 100,
      customLocations: [],
    },
  });

  const { fields: upstreamFields, append: appendUpstream, remove: removeUpstream } = useFieldArray({
    control,
    name: 'upstreams',
  });

  const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
    control,
    name: 'customLocations',
  });

  const realIpEnabled = watch('realIpEnabled');
  const autoCreateSSL = watch('autoCreateSSL');
  const healthCheckEnabled = watch('healthCheckEnabled');

  // Reset form when dialog opens or domain changes
  useEffect(() => {
    if (open) {
      if (domain) {
        // Edit mode
        reset({
          name: domain.name || '',
          status: domain.status || 'active',
          lbAlgorithm: (domain.loadBalancer?.algorithm || 'round_robin') as any,
          upstreams: domain.upstreams && domain.upstreams.length > 0
            ? domain.upstreams.map(u => ({
                host: u.host,
                port: u.port,
                protocol: (u.protocol || 'http') as 'http' | 'https',
                sslVerify: u.sslVerify !== undefined ? u.sslVerify : true,
                weight: u.weight || 1,
                maxFails: u.maxFails || 3,
                failTimeout: u.failTimeout || 30,
              }))
            : [{ host: '', port: 80, protocol: 'http', sslVerify: true, weight: 1, maxFails: 3, failTimeout: 30 }],
          modsecEnabled: domain.modsecEnabled !== undefined ? domain.modsecEnabled : true,
          realIpEnabled: (domain as any).realIpEnabled || false,
          realIpCloudflare: (domain as any).realIpCloudflare || false,
          healthCheckEnabled: domain.loadBalancer?.healthCheckEnabled !== undefined ? domain.loadBalancer.healthCheckEnabled : true,
          healthCheckPath: domain.loadBalancer?.healthCheckPath || '/health',
          healthCheckInterval: domain.loadBalancer?.healthCheckInterval || 30,
          healthCheckTimeout: domain.loadBalancer?.healthCheckTimeout || 5,
          hstsEnabled: (domain as any).hstsEnabled || false,
          http2Enabled: (domain as any).http2Enabled !== undefined ? (domain as any).http2Enabled : true,
          grpcEnabled: (domain as any).grpcEnabled || false,
          clientMaxBodySize: (domain as any).clientMaxBodySize || 100,
          customLocations: (domain as any).customLocations || [],
        });
      } else {
        // Create mode
        reset({
          name: '',
          status: 'active',
          lbAlgorithm: 'round_robin',
          upstreams: [{ host: '', port: 80, protocol: 'http', sslVerify: true, weight: 1, maxFails: 3, failTimeout: 30 }],
          modsecEnabled: true,
          autoCreateSSL: false,
          sslEmail: '',
          realIpEnabled: false,
          realIpCloudflare: false,
          healthCheckEnabled: true,
          healthCheckPath: '/health',
          healthCheckInterval: 30,
          healthCheckTimeout: 5,
          hstsEnabled: false,
          http2Enabled: true,
          grpcEnabled: false,
          clientMaxBodySize: 100,
          customLocations: [],
        });
      }
    }
  }, [open, domain, reset]);

  const onSubmit = (data: FormData) => {
    if (!data.name) {
      toast.error('Domain name is required');
      return;
    }

    if (data.upstreams.length === 0 || !data.upstreams.some(u => u.host)) {
      toast.error('At least one valid upstream backend is required');
      return;
    }

    // Validate SSL email if auto-create is enabled
    if (data.autoCreateSSL && !data.sslEmail) {
      toast.error('Email is required when auto-creating SSL certificate');
      return;
    }

    // Prepare data in API format
    const domainData: any = {
      name: data.name,
      status: data.status,
      modsecEnabled: data.modsecEnabled,
      upstreams: data.upstreams.filter(u => u.host).map(u => ({
        host: u.host,
        port: Number(u.port),
        protocol: u.protocol,
        sslVerify: u.sslVerify,
        weight: Number(u.weight),
        maxFails: Number(u.maxFails),
        failTimeout: Number(u.failTimeout),
      })),
      loadBalancer: {
        algorithm: data.lbAlgorithm,
        healthCheckEnabled: data.healthCheckEnabled,
        healthCheckInterval: Number(data.healthCheckInterval),
        healthCheckTimeout: Number(data.healthCheckTimeout),
        healthCheckPath: data.healthCheckPath,
      },
      realIpConfig: {
        realIpEnabled: data.realIpEnabled,
        realIpCloudflare: data.realIpCloudflare,
        realIpCustomCidrs: [],
      },
      advancedConfig: {
        hstsEnabled: data.hstsEnabled,
        http2Enabled: data.http2Enabled,
        grpcEnabled: data.grpcEnabled,
        clientMaxBodySize: Number(data.clientMaxBodySize),
        customLocations: data.customLocations.filter(loc => loc.path && loc.upstreams.length > 0),
      },
    };

    // Add SSL auto-creation fields only when creating new domain
    if (!domain && data.autoCreateSSL) {
      domainData.autoCreateSSL = true;
      domainData.sslEmail = data.sslEmail;
    }

    onSave(domainData);
    // Do not close dialog here - let parent component handle it after successful save
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{domain ? 'Edit Domain' : 'Add New Domain'}</DialogTitle>
          <DialogDescription>
            Configure domain settings with Basic, Security, and Advanced options
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <Server className="h-4 w-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <Settings className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BASIC */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Domain Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Domain name is required' })}
                  placeholder="example.com"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as any)}
                    disabled={isLoading}
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
                    value={watch('lbAlgorithm')}
                    onValueChange={(value) => setValue('lbAlgorithm', value as any)}
                    disabled={isLoading}
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
                  <h4 className="font-medium">Upstream Backends *</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendUpstream({ host: '', port: 80, protocol: 'http', sslVerify: true, weight: 1, maxFails: 3, failTimeout: 30 })}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Backend
                  </Button>
                </div>

                <div className="space-y-4">
                  {upstreamFields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium">Backend #{index + 1}</h4>
                            {upstreamFields.length > 1 && (
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
                                {...register(`upstreams.${index}.host`, { required: 'Host is required' })}
                                placeholder="10.0.1.10"
                              />
                              {errors.upstreams?.[index]?.host && (
                                <p className="text-sm text-destructive">{errors.upstreams[index]?.host?.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Port</Label>
                              <Input
                                type="number"
                                {...register(`upstreams.${index}.port`, { min: 1, max: 65535 })}
                                placeholder="80"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Protocol</Label>
                              <Select
                                value={watch(`upstreams.${index}.protocol`)}
                                onValueChange={(value) => setValue(`upstreams.${index}.protocol`, value as any)}
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

                          {watch(`upstreams.${index}.protocol`) === 'https' && (
                            <div className="flex items-center justify-between bg-muted/50 p-3 rounded">
                              <div>
                                <Label>Disable SSL Verification</Label>
                                <p className="text-xs text-muted-foreground">
                                  Skip backend certificate validation
                                </p>
                              </div>
                              <Controller
                                name={`upstreams.${index}.sslVerify`}
                                control={control}
                                render={({ field }) => (
                                  <Switch
                                    checked={!field.value}
                                    onCheckedChange={(checked) => field.onChange(!checked)}
                                  />
                                )}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Weight</Label>
                              <Input
                                type="number"
                                {...register(`upstreams.${index}.weight`, { min: 1, max: 100 })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Max Fails</Label>
                              <Input
                                type="number"
                                {...register(`upstreams.${index}.maxFails`, { min: 1, max: 10 })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Fail Timeout (s)</Label>
                              <Input
                                type="number"
                                {...register(`upstreams.${index}.failTimeout`, { min: 1, max: 300 })}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: SECURITY */}
            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="modsec">Enable ModSecurity WAF</Label>
                  <p className="text-sm text-muted-foreground">
                    Activate Web Application Firewall protection
                  </p>
                </div>
                <Controller
                  name="modsecEnabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="modsec"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {!domain && (
                <>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="autoSSL">Auto-create SSL Certificate</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically issue Let's Encrypt/ZeroSSL certificate after creating domain
                      </p>
                    </div>
                    <Controller
                      name="autoCreateSSL"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="autoSSL"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  {autoCreateSSL && (
                    <div className="ml-4 border-l-2 pl-4 space-y-2">
                      <Label htmlFor="sslEmail">Email for SSL Certificate *</Label>
                      <Input
                        id="sslEmail"
                        type="email"
                        {...register('sslEmail', { 
                          required: autoCreateSSL ? 'Email is required for SSL certificate' : false,
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        placeholder="admin@example.com"
                      />
                      {errors.sslEmail && (
                        <p className="text-sm text-destructive">{errors.sslEmail.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        This email will be used for SSL certificate notifications and renewal
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="realIp">Get Real Client IP from Proxy Headers</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real IP detection (for Cloudflare/CDN)
                  </p>
                </div>
                <Controller
                  name="realIpEnabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="realIp"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {realIpEnabled && (
                <div className="ml-4 border-l-2 pl-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cloudflare">Use Cloudflare IP Ranges</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically trust all Cloudflare IPs
                      </p>
                    </div>
                    <Controller
                      name="realIpCloudflare"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="cloudflare"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="healthCheck">Monitor Backend Availability</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable health checks for upstream backends
                  </p>
                </div>
                <Controller
                  name="healthCheckEnabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="healthCheck"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {healthCheckEnabled && (
                <div className="ml-4 border-l-2 pl-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="healthCheckPath">Health Check Path</Label>
                    <Input
                      id="healthCheckPath"
                      {...register('healthCheckPath')}
                      placeholder="/health"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="healthCheckInterval">Interval (seconds)</Label>
                      <Input
                        id="healthCheckInterval"
                        type="number"
                        {...register('healthCheckInterval', { min: 1, max: 300 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="healthCheckTimeout">Timeout (seconds)</Label>
                      <Input
                        id="healthCheckTimeout"
                        type="number"
                        {...register('healthCheckTimeout', { min: 1, max: 60 })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: ADVANCED */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div>
                <h4 className="text-sm font-medium mb-4">Security Features</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="hsts">Enable HSTS (HTTP Strict Transport Security)</Label>
                      <p className="text-sm text-muted-foreground">
                        Force browsers to use HTTPS with preload
                      </p>
                    </div>
                    <Controller
                      name="hstsEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="hsts"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="http2">Enable HTTP/2</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable HTTP/2 protocol support
                      </p>
                    </div>
                    <Controller
                      name="http2Enabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="http2"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="clientMaxBodySize">Maximum Request Body Size (MB)</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Maximum size of the request body (client_max_body_size). Default is 100MB.
                      </p>
                      <Input
                        id="clientMaxBodySize"
                        type="number"
                        min="1"
                        max="10000"
                        {...register('clientMaxBodySize', { 
                          required: 'Client max body size is required',
                          min: { value: 1, message: 'Minimum size is 1MB' },
                          max: { value: 10000, message: 'Maximum size is 10000MB (10GB)' }
                        })}
                        placeholder="100"
                        disabled={isLoading}
                      />
                      {errors.clientMaxBodySize && (
                        <p className="text-sm text-destructive">{errors.clientMaxBodySize.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-4">gRPC Configuration</h4>
                
                <TooltipProvider>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div>
                        <Label htmlFor="grpc">Enable gRPC/gRPCs Support</Label>
                        <p className="text-sm text-muted-foreground">
                          Use grpc_pass/grpcs_pass instead of proxy_pass for main location
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>When enabled, the root location (/) will use grpc_pass/grpcs_pass</p>
                          <p>protocol instead of HTTP proxy_pass</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Controller
                      name="grpcEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="grpc"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </TooltipProvider>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Custom Location Blocks</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendLocation({ 
                      path: '', 
                      useUpstream: false,
                      upstreamType: 'proxy_pass', 
                      upstreams: [],
                      config: ''
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Location
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Define custom location blocks with optional upstream backends or custom configuration
                </p>

                <div className="space-y-4">
                  {locationFields.map((field, locationIndex) => (
                    <Card key={field.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium">Location #{locationIndex + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLocation(locationIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label>Location Path *</Label>
                            <Input
                              {...register(`customLocations.${locationIndex}.path`)}
                              placeholder="/api"
                            />
                            <p className="text-xs text-muted-foreground">Example: /api, /static, /admin</p>
                          </div>

                          {/* Toggle: Use Upstream Backend */}
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`useUpstream-${locationIndex}`}>Use Upstream Backend</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Enable: Configure backend servers for load balancing</p>
                                    <p>Disable: Write custom nginx config manually</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Controller
                              name={`customLocations.${locationIndex}.useUpstream`}
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  id={`useUpstream-${locationIndex}`}
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked && (!watch(`customLocations.${locationIndex}.upstreams`) || watch(`customLocations.${locationIndex}.upstreams`).length === 0)) {
                                      setValue(`customLocations.${locationIndex}.upstreams`, [
                                        { host: '', port: 80, protocol: 'http', sslVerify: true, weight: 1, maxFails: 3, failTimeout: 30 }
                                      ]);
                                    }
                                  }}
                                />
                              )}
                            />
                          </div>

                          {/* Show upstream config if enabled */}
                          {watch(`customLocations.${locationIndex}.useUpstream`) && (
                            <div className="space-y-4 p-4 border rounded-lg bg-background">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label>Upstream Type</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>proxy_pass: Standard HTTP/HTTPS proxy</p>
                                        <p>grpc_pass: gRPC over HTTP/2 (grpc://)</p>
                                        <p>grpcs_pass: gRPC over TLS (grpcs://)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Select
                                  value={watch(`customLocations.${locationIndex}.upstreamType`)}
                                  onValueChange={(value) => setValue(`customLocations.${locationIndex}.upstreamType`, value as any)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="proxy_pass">HTTP/HTTPS Proxy</SelectItem>
                                    <SelectItem value="grpc_pass">gRPC (HTTP/2)</SelectItem>
                                    <SelectItem value="grpcs_pass">gRPC (TLS)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Upstream Servers - Required when useUpstream is true */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label className="text-red-500">Backend Servers * (Required)</Label>
                                    <p className="text-xs text-muted-foreground">At least one backend server with valid host and port</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const currentUpstreams = watch(`customLocations.${locationIndex}.upstreams`) || [];
                                      setValue(`customLocations.${locationIndex}.upstreams`, [
                                        ...currentUpstreams,
                                        { host: '', port: 80, protocol: 'http', sslVerify: true, weight: 1, maxFails: 3, failTimeout: 30 }
                                      ]);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Server
                                  </Button>
                                </div>

                                {(watch(`customLocations.${locationIndex}.upstreams`) || []).map((upstream: any, upstreamIndex: number) => (
                                  <Card key={upstreamIndex} className="bg-muted/30">
                                    <CardContent className="pt-4 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">Server #{upstreamIndex + 1}</span>
                                        {(watch(`customLocations.${locationIndex}.upstreams`) || []).length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const currentUpstreams = watch(`customLocations.${locationIndex}.upstreams`) || [];
                                              setValue(
                                                `customLocations.${locationIndex}.upstreams`,
                                                currentUpstreams.filter((_: any, i: number) => i !== upstreamIndex)
                                              );
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                          </Button>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Host *</Label>
                                          <Input
                                            {...register(`customLocations.${locationIndex}.upstreams.${upstreamIndex}.host`, { required: true })}
                                            placeholder="192.168.1.10"
                                            className="h-8 text-sm"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-xs">Port *</Label>
                                          <Input
                                            type="number"
                                            {...register(`customLocations.${locationIndex}.upstreams.${upstreamIndex}.port`, { min: 1, max: 65535 })}
                                            placeholder="80"
                                            className="h-8 text-sm"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-xs">Protocol</Label>
                                          <Select
                                            value={watch(`customLocations.${locationIndex}.upstreams.${upstreamIndex}.protocol`)}
                                            onValueChange={(value) => setValue(`customLocations.${locationIndex}.upstreams.${upstreamIndex}.protocol`, value as any)}
                                          >
                                            <SelectTrigger className="h-8 text-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="http">HTTP</SelectItem>
                                              <SelectItem value="https">HTTPS</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      {watch(`customLocations.${locationIndex}.upstreams.${upstreamIndex}.protocol`) === 'https' && (
                                        <div className="flex items-center justify-between bg-background p-2 rounded text-xs">
                                          <Label className="text-xs">Disable SSL Verification</Label>
                                          <Controller
                                            name={`customLocations.${locationIndex}.upstreams.${upstreamIndex}.sslVerify`}
                                            control={control}
                                            render={({ field }) => (
                                              <Switch
                                                checked={!field.value}
                                                onCheckedChange={(checked) => field.onChange(!checked)}
                                              />
                                            )}
                                          />
                                        </div>
                                      )}

                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Weight</Label>
                                          <Input
                                            type="number"
                                            {...register(`customLocations.${locationIndex}.upstreams.${upstreamIndex}.weight`, { min: 1 })}
                                            className="h-8 text-sm"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-xs">Max Fails</Label>
                                          <Input
                                            type="number"
                                            {...register(`customLocations.${locationIndex}.upstreams.${upstreamIndex}.maxFails`, { min: 1 })}
                                            className="h-8 text-sm"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-xs">Timeout (s)</Label>
                                          <Input
                                            type="number"
                                            {...register(`customLocations.${locationIndex}.upstreams.${upstreamIndex}.failTimeout`, { min: 1 })}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}

                                {(!watch(`customLocations.${locationIndex}.upstreams`) || watch(`customLocations.${locationIndex}.upstreams`).length === 0) && (
                                  <div className="text-center p-4 border border-dashed rounded-lg">
                                    <p className="text-sm text-muted-foreground">No backend servers configured</p>
                                    <p className="text-xs text-muted-foreground">Click "Add Server" to add a backend</p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Additional Config (optional)</Label>
                                <Textarea
                                  {...register(`customLocations.${locationIndex}.config`)}
                                  placeholder="# Add custom nginx directives (do NOT include proxy_pass/grpc_pass)"
                                  rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Custom directives will be added after auto-generated proxy configuration
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Show custom config field if upstream disabled */}
                          {!watch(`customLocations.${locationIndex}.useUpstream`) && (
                            <div className="space-y-2">
                              <Label className="text-red-500">Custom Nginx Configuration * (Required)</Label>
                              <Textarea
                                {...register(`customLocations.${locationIndex}.config`)}
                                placeholder={`# Example:\nproxy_pass http://192.168.1.100:8080/;\nproxy_set_header Host $host;\nproxy_set_header X-Real-IP $remote_addr;`}
                                rows={6}
                              />
                              <p className="text-xs text-muted-foreground">
                                Write complete nginx directives including proxy_pass or grpc_pass
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {domain ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                domain ? 'Update Domain' : 'Create Domain'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

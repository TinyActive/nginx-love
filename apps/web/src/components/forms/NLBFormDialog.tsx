import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useCreateNLB, useUpdateNLB } from '@/queries/nlb.query-options';
import { NetworkLoadBalancer, CreateNLBInput } from '@/types';
import {
  validateNLBConfig,
  isValidNLBName,
  validateUpstreamHost,
  getValidationHints,
  checkConfigurationWarnings,
} from '@/utils/nlb-validators';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, HelpCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NLBFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nlb?: NetworkLoadBalancer | null;
  mode: 'create' | 'edit';
}

type FormData = CreateNLBInput;

export default function NLBFormDialog({ isOpen, onClose, nlb, mode }: NLBFormDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateNLB();
  const updateMutation = useUpdateNLB();
  const [configWarnings, setConfigWarnings] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
      description: '',
      port: 10000,
      protocol: 'tcp',
      algorithm: 'round_robin',
      upstreams: [{ host: '', port: 80, weight: 1, maxFails: 3, failTimeout: 10, maxConns: 0, backup: false, down: false }],
      proxyTimeout: 3,
      proxyConnectTimeout: 1,
      proxyNextUpstream: true,
      proxyNextUpstreamTimeout: 0,
      proxyNextUpstreamTries: 0,
      healthCheckEnabled: true,
      healthCheckInterval: 10,
      healthCheckTimeout: 5,
      healthCheckRises: 2,
      healthCheckFalls: 3,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'upstreams',
  });

  const protocol = watch('protocol');
  const upstreams = watch('upstreams');
  const proxyTimeout = watch('proxyTimeout');
  const proxyConnectTimeout = watch('proxyConnectTimeout');
  const healthCheckEnabled = watch('healthCheckEnabled');
  const healthCheckInterval = watch('healthCheckInterval');
  const healthCheckTimeout = watch('healthCheckTimeout');

  // Check for configuration warnings whenever form values change
  useEffect(() => {
    if (upstreams && upstreams.length > 0) {
      const warnings = checkConfigurationWarnings({
        upstreams: upstreams,
        proxyTimeout: proxyTimeout || 3,
        proxyConnectTimeout: proxyConnectTimeout || 1,
        healthCheckEnabled: healthCheckEnabled || false,
        healthCheckInterval: healthCheckInterval,
        healthCheckTimeout: healthCheckTimeout,
      });
      setConfigWarnings(warnings);
    }
  }, [upstreams, proxyTimeout, proxyConnectTimeout, healthCheckEnabled, healthCheckInterval, healthCheckTimeout]);

  useEffect(() => {
    if (isOpen && nlb && mode === 'edit') {
      reset({
        name: nlb.name,
        description: nlb.description || '',
        port: nlb.port,
        protocol: nlb.protocol,
        algorithm: nlb.algorithm,
        upstreams: nlb.upstreams.map(u => ({
          host: u.host,
          port: u.port,
          weight: u.weight,
          maxFails: u.maxFails,
          failTimeout: u.failTimeout,
          maxConns: u.maxConns,
          backup: u.backup,
          down: u.down,
        })),
        proxyTimeout: nlb.proxyTimeout,
        proxyConnectTimeout: nlb.proxyConnectTimeout,
        proxyNextUpstream: nlb.proxyNextUpstream,
        proxyNextUpstreamTimeout: nlb.proxyNextUpstreamTimeout,
        proxyNextUpstreamTries: nlb.proxyNextUpstreamTries,
        healthCheckEnabled: nlb.healthCheckEnabled,
        healthCheckInterval: nlb.healthCheckInterval,
        healthCheckTimeout: nlb.healthCheckTimeout,
        healthCheckRises: nlb.healthCheckRises,
        healthCheckFalls: nlb.healthCheckFalls,
      });
    } else if (isOpen && mode === 'create') {
      reset({
        name: '',
        description: '',
        port: 10000,
        protocol: 'tcp',
        algorithm: 'round_robin',
        upstreams: [{ host: '', port: 80, weight: 1, maxFails: 3, failTimeout: 10, maxConns: 0, backup: false, down: false }],
        proxyTimeout: 3,
        proxyConnectTimeout: 1,
        proxyNextUpstream: true,
        proxyNextUpstreamTimeout: 0,
        proxyNextUpstreamTries: 0,
        healthCheckEnabled: true,
        healthCheckInterval: 10,
        healthCheckTimeout: 5,
        healthCheckRises: 2,
        healthCheckFalls: 3,
      });
    }
  }, [isOpen, nlb, mode, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      // Validate complete configuration before submission
      const validation = validateNLBConfig({
        name: data.name,
        port: Number(data.port),
        upstreams: data.upstreams.map(u => ({
          host: u.host,
          port: Number(u.port),
          weight: Number(u.weight),
          maxFails: Number(u.maxFails),
          failTimeout: Number(u.failTimeout),
          maxConns: Number(u.maxConns),
          backup: Boolean(u.backup),
          down: Boolean(u.down),
        })),
        proxyTimeout: Number(data.proxyTimeout),
        proxyConnectTimeout: Number(data.proxyConnectTimeout),
        proxyNextUpstreamTimeout: Number(data.proxyNextUpstreamTimeout),
        proxyNextUpstreamTries: Number(data.proxyNextUpstreamTries),
        healthCheckEnabled: Boolean(data.healthCheckEnabled),
        healthCheckInterval: Number(data.healthCheckInterval),
        healthCheckTimeout: Number(data.healthCheckTimeout),
        healthCheckRises: Number(data.healthCheckRises),
        healthCheckFalls: Number(data.healthCheckFalls),
      });

      if (!validation.valid) {
        const errorMessages = Object.entries(validation.errors)
          .map(([field, error]) => {
            // Format field names to be more user-friendly
            const fieldNames: Record<string, string> = {
              name: 'Name',
              port: 'Port',
              upstreams: 'Upstreams',
              proxyTimeout: 'Proxy Timeout',
              proxyConnectTimeout: 'Proxy Connect Timeout',
              proxyNextUpstreamTimeout: 'Next Upstream Timeout',
              proxyNextUpstreamTries: 'Next Upstream Tries',
              healthCheckInterval: 'Health Check Interval',
              healthCheckTimeout: 'Health Check Timeout',
              healthCheckRises: 'Health Check Rises',
              healthCheckFalls: 'Health Check Falls',
            };
            const friendlyField = fieldNames[field] || field;
            return `${friendlyField}: ${error}`;
          });
        
        setValidationErrors(errorMessages);
        
        toast({
          title: 'Configuration Error',
          description: `Please fix ${errorMessages.length} validation error${errorMessages.length > 1 ? 's' : ''} before submitting.`,
          variant: 'destructive',
        });
        return;
      }

      // Clear validation errors if everything is valid
      setValidationErrors([]);

      // Convert all string numbers to actual numbers
      const processedData = {
        ...data,
        port: Number(data.port),
        proxyTimeout: Number(data.proxyTimeout),
        proxyConnectTimeout: Number(data.proxyConnectTimeout),
        proxyNextUpstream: Boolean(data.proxyNextUpstream),
        proxyNextUpstreamTimeout: Number(data.proxyNextUpstreamTimeout),
        proxyNextUpstreamTries: Number(data.proxyNextUpstreamTries),
        healthCheckEnabled: Boolean(data.healthCheckEnabled),
        healthCheckInterval: Number(data.healthCheckInterval),
        healthCheckTimeout: Number(data.healthCheckTimeout),
        healthCheckRises: Number(data.healthCheckRises),
        healthCheckFalls: Number(data.healthCheckFalls),
        upstreams: data.upstreams.map(upstream => ({
          ...upstream,
          port: Number(upstream.port),
          weight: Number(upstream.weight),
          maxFails: Number(upstream.maxFails),
          failTimeout: Number(upstream.failTimeout),
          maxConns: Number(upstream.maxConns),
          backup: Boolean(upstream.backup),
          down: Boolean(upstream.down),
        })),
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(processedData);
        toast({
          title: 'Success',
          description: 'NLB created successfully',
        });
      } else if (nlb) {
        await updateMutation.mutateAsync({ id: nlb.id, data: processedData });
        toast({
          title: 'Success',
          description: 'NLB updated successfully',
        });
      }
      onClose();
    } catch (error: any) {
      console.error('NLB submission error:', error);
      
      const response = error.response?.data;
      let errorMessages: string[] = [];
      let title = 'Error';
      
      // Handle validation errors from backend
      if (response?.errors && Array.isArray(response.errors)) {
        title = 'Validation Error';
        errorMessages = response.errors.map((err: any) => {
          if (err.msg && err.path) {
            return `${err.path}: ${err.msg}`;
          }
          return err.msg || err.message || 'Unknown error';
        });
        setValidationErrors(errorMessages);
      } else if (response?.message) {
        // Handle single error message
        if (response.message.includes('already exists')) {
          errorMessages = ['An NLB with this name already exists. Please choose a different name.'];
        } else if (response.message.includes('host not found') || response.message.includes('Invalid host')) {
          errorMessages = ['Invalid upstream host. Please check your IP address or hostname format.'];
        } else if (response.message.includes('nginx')) {
          errorMessages = ['Nginx configuration error: ' + response.message];
        } else {
          errorMessages = [response.message];
        }
        setValidationErrors(errorMessages);
      } else {
        errorMessages = [`Failed to ${mode} NLB. Please check your configuration and try again.`];
      }

      toast({
        title,
        description: errorMessages[0] || `Failed to ${mode} NLB`,
        variant: 'destructive',
      });
    }
  };

  const addUpstream = () => {
    append({ host: '', port: 80, weight: 1, maxFails: 3, failTimeout: 10, maxConns: 0, backup: false, down: false });
  };

  // Clear validation errors when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setValidationErrors([]);
      setConfigWarnings([]);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create' : 'Edit'} Network Load Balancer</DialogTitle>
          <DialogDescription>
            Configure a Layer 4 load balancer for TCP/UDP traffic distribution.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Validation Errors Alert */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Configuration Errors ({validationErrors.length})
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-red-600 font-bold">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-600 mt-2">
                    Please fix these errors before submitting the form.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="upstreams">Upstreams</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register('name', {
                    required: 'Name is required',
                    validate: (value) => {
                      const validation = isValidNLBName(value);
                      return validation.valid || validation.error || 'Invalid name';
                    },
                  })}
                  placeholder="my-load-balancer"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {getValidationHints('name')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Description of this load balancer"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">Port * (≥ 10000)</Label>
                  <Input
                    id="port"
                    type="number"
                    {...register('port', {
                      required: 'Port is required',
                      min: { value: 10000, message: 'Port must be ≥ 10000' },
                      max: { value: 65535, message: 'Port must be ≤ 65535' },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.port && (
                    <p className="text-sm text-destructive">{errors.port.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {getValidationHints('port')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol *</Label>
                  <Select
                    value={protocol}
                    onValueChange={(value) => setValue('protocol', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="tcp_udp">TCP + UDP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="algorithm">Load Balancing Algorithm</Label>
                <Select
                  defaultValue="round_robin"
                  onValueChange={(value) => setValue('algorithm', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                    <SelectItem value="least_conn">Least Connections</SelectItem>
                    <SelectItem value="ip_hash">IP Hash</SelectItem>
                    <SelectItem value="hash">Hash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="upstreams" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label>Backend Servers *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addUpstream}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Upstream
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium">Upstream {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Host *</Label>
                          <Input
                            {...register(`upstreams.${index}.host`, {
                              required: 'Host is required',
                              validate: (value) => {
                                const validation = validateUpstreamHost(value);
                                return validation.valid || validation.error || 'Invalid host';
                              },
                            })}
                            placeholder="192.168.1.100 or backend.example.com"
                          />
                          {errors.upstreams?.[index]?.host && (
                            <p className="text-sm text-destructive">
                              {errors.upstreams[index]?.host?.message}
                            </p>
                          )}
                          {!errors.upstreams?.[index]?.host && (
                            <p className="text-xs text-muted-foreground">
                              {getValidationHints('host')}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Port *</Label>
                          <Input
                            type="number"
                            {...register(`upstreams.${index}.port`, {
                              required: 'Port is required',
                              min: { value: 1, message: 'Port must be ≥ 1' },
                              max: { value: 65535, message: 'Port must be ≤ 65535' },
                              valueAsNumber: true,
                            })}
                          />
                          {errors.upstreams?.[index]?.port && (
                            <p className="text-sm text-destructive">
                              {errors.upstreams[index]?.port?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Weight</Label>
                          <Input
                            type="number"
                            {...register(`upstreams.${index}.weight`, {
                              min: { value: 1, message: 'Weight must be ≥ 1' },
                              max: { value: 100, message: 'Weight must be ≤ 100' },
                              valueAsNumber: true,
                            })}
                          />
                          {errors.upstreams?.[index]?.weight && (
                            <p className="text-xs text-destructive">
                              {errors.upstreams[index]?.weight?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Max Fails</Label>
                          <Input
                            type="number"
                            {...register(`upstreams.${index}.maxFails`, {
                              min: { value: 0, message: 'Max fails must be ≥ 0' },
                              max: { value: 100, message: 'Max fails must be ≤ 100' },
                              valueAsNumber: true,
                            })}
                          />
                          {errors.upstreams?.[index]?.maxFails && (
                            <p className="text-xs text-destructive">
                              {errors.upstreams[index]?.maxFails?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Fail Timeout (s)</Label>
                          <Input
                            type="number"
                            {...register(`upstreams.${index}.failTimeout`, {
                              min: { value: 1, message: 'Fail timeout must be ≥ 1' },
                              max: { value: 3600, message: 'Fail timeout must be ≤ 3600' },
                              valueAsNumber: true,
                            })}
                          />
                          {errors.upstreams?.[index]?.failTimeout && (
                            <p className="text-xs text-destructive">
                              {errors.upstreams[index]?.failTimeout?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Max Connections</Label>
                          <Input
                            type="number"
                            {...register(`upstreams.${index}.maxConns`, {
                              min: { value: 0, message: 'Max connections must be ≥ 0' },
                              max: { value: 100000, message: 'Max connections must be ≤ 100000' },
                              valueAsNumber: true,
                            })}
                            placeholder="0 = unlimited"
                          />
                          {errors.upstreams?.[index]?.maxConns && (
                            <p className="text-xs text-destructive">
                              {errors.upstreams[index]?.maxConns?.message}
                            </p>
                          )}
                        </div>

                        <TooltipProvider>
                          <div className="flex items-center space-x-2">
                            <Controller
                              name={`upstreams.${index}.backup`}
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  id={`backup-${index}`}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              )}
                            />
                            <Label htmlFor={`backup-${index}`}>Backup</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Server chỉ được dùng khi tất cả server chính đều down</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>

                        <TooltipProvider>
                          <div className="flex items-center space-x-2">
                            <Controller
                              name={`upstreams.${index}.down`}
                              control={control}
                              render={({ field }) => (
                                <Switch
                                  id={`down-${index}`}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              )}
                            />
                            <Label htmlFor={`down-${index}`}>Mark Down</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Đánh dấu server này không khả dụng (maintenance/error)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {errors.upstreams && (
                <p className="text-sm text-destructive">
                  At least one upstream is required
                </p>
              )}

              {/* Configuration Warnings */}
              {configWarnings.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Configuration Warnings
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {configWarnings.map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-4">Proxy Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Proxy Timeout (s)</Label>
                    <Input
                      type="number"
                      {...register('proxyTimeout', {
                        min: { value: 1, message: 'Proxy timeout must be ≥ 1' },
                        max: { value: 3600, message: 'Proxy timeout must be ≤ 3600' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.proxyTimeout && (
                      <p className="text-xs text-destructive">{errors.proxyTimeout.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {getValidationHints('proxyTimeout')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Proxy Connect Timeout (s)</Label>
                    <Input
                      type="number"
                      {...register('proxyConnectTimeout', {
                        min: { value: 1, message: 'Proxy connect timeout must be ≥ 1' },
                        max: { value: 300, message: 'Proxy connect timeout must be ≤ 300' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.proxyConnectTimeout && (
                      <p className="text-xs text-destructive">{errors.proxyConnectTimeout.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {getValidationHints('proxyConnectTimeout')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="proxyNextUpstream"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="proxyNextUpstream"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="proxyNextUpstream">Enable Proxy Next Upstream</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Next Upstream Timeout (s)</Label>
                    <Input
                      type="number"
                      {...register('proxyNextUpstreamTimeout', {
                        min: { value: 0, message: 'Timeout must be ≥ 0' },
                        max: { value: 3600, message: 'Timeout must be ≤ 3600' },
                        valueAsNumber: true,
                      })}
                      placeholder="0 = disabled"
                    />
                    {errors.proxyNextUpstreamTimeout && (
                      <p className="text-xs text-destructive">{errors.proxyNextUpstreamTimeout.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Next Upstream Tries</Label>
                    <Input
                      type="number"
                      {...register('proxyNextUpstreamTries', {
                        min: { value: 0, message: 'Tries must be ≥ 0' },
                        max: { value: 100, message: 'Tries must be ≤ 100' },
                        valueAsNumber: true,
                      })}
                      placeholder="0 = unlimited"
                    />
                    {errors.proxyNextUpstreamTries && (
                      <p className="text-xs text-destructive">{errors.proxyNextUpstreamTries.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-4">Health Check Settings</h4>
                <div className="flex items-center space-x-2 mb-4">
                  <Controller
                    name="healthCheckEnabled"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="healthCheckEnabled"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="healthCheckEnabled">Enable Health Checks</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Check Interval (s)</Label>
                    <Input
                      type="number"
                      {...register('healthCheckInterval', {
                        min: { value: 5, message: 'Interval must be ≥ 5' },
                        max: { value: 3600, message: 'Interval must be ≤ 3600' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.healthCheckInterval && (
                      <p className="text-xs text-destructive">{errors.healthCheckInterval.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {getValidationHints('healthCheckInterval')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Check Timeout (s)</Label>
                    <Input
                      type="number"
                      {...register('healthCheckTimeout', {
                        min: { value: 1, message: 'Timeout must be ≥ 1' },
                        max: { value: 300, message: 'Timeout must be ≤ 300' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.healthCheckTimeout && (
                      <p className="text-xs text-destructive">{errors.healthCheckTimeout.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {getValidationHints('healthCheckTimeout')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Rises (successful checks)</Label>
                    <Input
                      type="number"
                      {...register('healthCheckRises', {
                        min: { value: 1, message: 'Rises must be ≥ 1' },
                        max: { value: 10, message: 'Rises must be ≤ 10' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.healthCheckRises && (
                      <p className="text-xs text-destructive">{errors.healthCheckRises.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Falls (failed checks)</Label>
                    <Input
                      type="number"
                      {...register('healthCheckFalls', {
                        min: { value: 1, message: 'Falls must be ≥ 1' },
                        max: { value: 10, message: 'Falls must be ≤ 10' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.healthCheckFalls && (
                      <p className="text-xs text-destructive">{errors.healthCheckFalls.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : mode === 'create'
                ? 'Create'
                : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

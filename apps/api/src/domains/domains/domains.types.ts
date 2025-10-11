import { Domain, Upstream, LoadBalancerConfig, SSLCertificate, ModSecRule } from '@prisma/client';

/**
 * Domain types and interfaces
 */

// Domain with all relations
export interface DomainWithRelations extends Domain {
  upstreams: Upstream[];
  loadBalancer: LoadBalancerConfig | null;
  sslCertificate: SSLCertificate | null;
  modsecRules?: ModSecRule[];
}

// Upstream creation data
export interface CreateUpstreamData {
  host: string;
  port: number;
  protocol?: string;
  sslVerify?: boolean;
  weight?: number;
  maxFails?: number;
  failTimeout?: number;
}

// Load balancer configuration data
export interface LoadBalancerConfigData {
  algorithm?: string;
  healthCheckEnabled?: boolean;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  healthCheckPath?: string;
}

// Real IP configuration data
export interface RealIpConfigData {
  realIpEnabled?: boolean;
  realIpCloudflare?: boolean;
  realIpCustomCidrs?: string[];
}

// Domain creation input
export interface CreateDomainInput {
  name: string;
  upstreams: CreateUpstreamData[];
  loadBalancer?: LoadBalancerConfigData;
  modsecEnabled?: boolean;
  realIpConfig?: RealIpConfigData;
}

// Domain update input
export interface UpdateDomainInput {
  name?: string;
  status?: string;
  modsecEnabled?: boolean;
  upstreams?: CreateUpstreamData[];
  loadBalancer?: LoadBalancerConfigData;
  realIpConfig?: RealIpConfigData;
}

// Domain query filters
export interface DomainQueryFilters {
  search?: string;
  status?: string;
  sslEnabled?: string;
  modsecEnabled?: string;
}

// Domain query options
export interface DomainQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: DomainQueryFilters;
}

// Nginx config generation options
export interface NginxConfigOptions {
  domain: DomainWithRelations;
}

// Nginx reload options
export interface NginxReloadOptions {
  silent?: boolean;
  isContainer?: boolean;
}

// Nginx reload result
export interface NginxReloadResult {
  success: boolean;
  method?: 'reload' | 'restart';
  mode?: 'container' | 'host';
  error?: string;
}

// SSL toggle input
export interface ToggleSSLInput {
  sslEnabled: boolean;
}

// Environment detection
export interface EnvironmentInfo {
  isContainer: boolean;
  nodeEnv: string;
}
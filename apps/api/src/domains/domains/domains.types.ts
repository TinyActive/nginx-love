import { Domain, Upstream, LoadBalancerConfig, SSLCertificate, ModSecRule, AccessListDomain, AccessList } from '@prisma/client';

/**
 * Domain types and interfaces
 */

// Domain with all relations
export interface DomainWithRelations extends Domain {
  upstreams: Upstream[];
  loadBalancer: LoadBalancerConfig | null;
  sslCertificate: SSLCertificate | null;
  modsecRules?: ModSecRule[];
  accessLists?: (AccessListDomain & { accessList: AccessList })[];
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

// Custom location configuration
export interface CustomLocationData {
  path: string; // Location path (e.g., /api, /admin)
  upstreamType: 'proxy_pass' | 'grpc_pass' | 'grpcs_pass'; // Type of upstream
  upstreams: CreateUpstreamData[]; // Upstream servers for this location
  config?: string; // Additional custom nginx config
}

// Advanced configuration data
export interface AdvancedConfigData {
  hstsEnabled?: boolean; // Enable HSTS header
  http2Enabled?: boolean; // Enable HTTP/2
  grpcEnabled?: boolean; // Enable gRPC support (default proxy_pass replacement)
  clientMaxBodySize?: number; // Maximum request body size in MB (default: 100)
  customLocations?: CustomLocationData[]; // Custom location blocks
}

// Domain creation input
export interface CreateDomainInput {
  name: string;
  upstreams: CreateUpstreamData[];
  loadBalancer?: LoadBalancerConfigData;
  modsecEnabled?: boolean;
  realIpConfig?: RealIpConfigData;
  advancedConfig?: AdvancedConfigData;
  autoCreateSSL?: boolean; // Auto-create SSL certificate after domain creation
  sslEmail?: string; // Email for SSL certificate (Let's Encrypt/ZeroSSL)
}

// Domain update input
export interface UpdateDomainInput {
  name?: string;
  status?: string;
  modsecEnabled?: boolean;
  sslEnabled?: boolean;
  sslExpiry?: Date;
  upstreams?: CreateUpstreamData[];
  loadBalancer?: LoadBalancerConfigData;
  realIpConfig?: RealIpConfigData;
  advancedConfig?: AdvancedConfigData;
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
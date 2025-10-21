export interface Domain {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  sslEnabled: boolean;
  sslExpiry?: string;
  modsecEnabled: boolean;
  upstreams: Upstream[];
  loadBalancer: LoadBalancerConfig;
  sslCertificate?: SSLCertificate | null;
  createdAt: string;
  lastModified: string;
  // Real IP configuration
  realIpEnabled?: boolean;
  realIpCloudflare?: boolean;
  realIpCustomCidrs?: string[];
  // Advanced configuration
  hstsEnabled?: boolean;
  http2Enabled?: boolean;
  grpcEnabled?: boolean;
  customLocations?: CustomLocation[];
}

export interface CustomLocation {
  path: string;
  useUpstream?: boolean; // Toggle: use upstream backend or custom config
  upstreamType: 'proxy_pass' | 'grpc_pass' | 'grpcs_pass';
  upstreams: Upstream[];
  config?: string; // Custom nginx directives
}

export interface Upstream {
  id: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  sslVerify: boolean;
  weight: number;
  maxFails: number;
  failTimeout: number;
  status: 'up' | 'down' | 'checking';
}

export interface LoadBalancerConfig {
  id?: string;
  domainId?: string;
  algorithm: 'round_robin' | 'least_conn' | 'ip_hash';
  healthCheckEnabled?: boolean;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  healthCheckPath?: string;
  // Legacy support for mock data
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    path: string;
  };
}

export interface ModSecurityRule {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  description: string;
}

export interface ModSecurityCRSRule {
  id?: string;
  ruleFile: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  paranoia?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModSecurityCustomRule {
  id: string;
  name: string;
  category: string;
  ruleContent: string;
  enabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SSLCertificate {
  id: string;
  domain?: {
    id: string;
    name: string;
    status: string;
  };
  domainId?: string;
  commonName: string;
  sans: string[];
  issuer: string;
  validFrom: string;
  validTo: string;
  autoRenew: boolean;
  status: 'valid' | 'expiring' | 'expired';
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface MetricData {
  timestamp: string;
  value: number;
}

export interface SystemMetrics {
  cpu: MetricData[];
  memory: MetricData[];
  bandwidth: MetricData[];
  requests: MetricData[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface ACLRule {
  id: string;
  name: string;
  type: 'whitelist' | 'blacklist';
  condition: {
    field: 'ip' | 'geoip' | 'user-agent' | 'url' | 'method' | 'header';
    operator: 'equals' | 'contains' | 'regex';
    value: string;
  };
  action: 'allow' | 'deny' | 'challenge';
  enabled: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  type: 'access' | 'error' | 'system';
  source: string;
  message: string;
  domain?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  // ModSecurity specific fields
  ruleId?: string;
  severity?: string;
  tags?: string[];
  uri?: string;
  uniqueId?: string;
  file?: string;
  line?: string;
  data?: string;
  fullMessage?: string; // Complete log message without truncation
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'telegram';
  enabled: boolean;
  config: {
    email?: string;
    chatId?: string;
    botToken?: string;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  channels: string[];
  enabled: boolean;
  checkInterval?: number; // Check interval in seconds (optional, default: 60)
}

export interface BackupConfig {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  size?: string;
}

export interface SlaveNode {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'online' | 'offline' | 'syncing' | 'error';
  lastSeen?: string;
  version?: string;
  
  // Sync configuration
  syncEnabled: boolean;
  syncInterval: number;
  configHash?: string;
  lastSyncAt?: string;
  
  // Metrics
  latency?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  
  createdAt: string;
  updatedAt: string;
  
  // Legacy support for old mock data
  syncStatus?: {
    lastSync: string;
    configHash: string;
    inSync: boolean;
  };
}

export interface PerformanceMetric {
  id: string;
  domain: string;
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  requestCount: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'moderator' | 'viewer';
  avatar?: string;
  phone?: string;
  timezone: string;
  language: 'en' | 'vi';
  createdAt: string;
  lastLogin: string;
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: 'totp' | 'sms';
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  type: 'login' | 'logout' | 'config_change' | 'user_action' | 'security';
  ip: string;
  userAgent: string;
  timestamp: string;
  details?: string;
  success: boolean;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface SystemConfig {
  id: string;
  nodeMode: 'master' | 'slave';
  
  // Master mode settings
  masterApiEnabled: boolean;
  
  // Slave mode settings
  slaveApiEnabled: boolean;
  masterHost?: string | null;
  masterPort?: number | null;
  masterApiKey?: string | null;
  syncInterval: number; // Sync interval in seconds
  
  // Connection status (for slave mode)
  connected: boolean;
  lastConnectedAt?: string | null;
  connectionError?: string | null;
  
  createdAt: string;
  updatedAt: string;
}

// Network Load Balancer Types
export interface NLBUpstream {
  id?: string;
  host: string;
  port: number;
  weight: number;
  maxFails: number;
  failTimeout: number;
  maxConns: number;
  backup: boolean;
  down: boolean;
  status?: 'up' | 'down' | 'checking';
  lastCheck?: string;
  lastError?: string | null;
  responseTime?: number | null;
}

export interface NetworkLoadBalancer {
  id: string;
  name: string;
  description?: string | null;
  port: number;
  protocol: 'tcp' | 'udp' | 'tcp_udp';
  algorithm: 'round_robin' | 'least_conn' | 'ip_hash' | 'hash';
  status: 'active' | 'inactive' | 'error';
  enabled: boolean;
  
  // Advanced settings
  proxyTimeout: number;
  proxyConnectTimeout: number;
  proxyNextUpstream: boolean;
  proxyNextUpstreamTimeout: number;
  proxyNextUpstreamTries: number;
  
  // Health check settings
  healthCheckEnabled: boolean;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  healthCheckRises: number;
  healthCheckFalls: number;
  
  // Relations
  upstreams: NLBUpstream[];
  healthChecks?: NLBHealthCheck[];
  
  createdAt: string;
  updatedAt: string;
}

export interface NLBHealthCheck {
  id: string;
  nlbId: string;
  upstreamHost: string;
  upstreamPort: number;
  status: 'up' | 'down' | 'checking';
  responseTime?: number | null;
  error?: string | null;
  checkedAt: string;
}

export interface CreateNLBInput {
  name: string;
  description?: string;
  port: number;
  protocol: 'tcp' | 'udp' | 'tcp_udp';
  algorithm?: 'round_robin' | 'least_conn' | 'ip_hash' | 'hash';
  upstreams: Omit<NLBUpstream, 'id' | 'status' | 'lastCheck' | 'lastError' | 'responseTime'>[];
  
  // Advanced settings
  proxyTimeout?: number;
  proxyConnectTimeout?: number;
  proxyNextUpstream?: boolean;
  proxyNextUpstreamTimeout?: number;
  proxyNextUpstreamTries?: number;
  
  // Health check settings
  healthCheckEnabled?: boolean;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  healthCheckRises?: number;
  healthCheckFalls?: number;
}

export interface UpdateNLBInput {
  name?: string;
  description?: string;
  port?: number;
  protocol?: 'tcp' | 'udp' | 'tcp_udp';
  algorithm?: 'round_robin' | 'least_conn' | 'ip_hash' | 'hash';
  status?: 'active' | 'inactive' | 'error';
  enabled?: boolean;
  upstreams?: Omit<NLBUpstream, 'id' | 'status' | 'lastCheck' | 'lastError' | 'responseTime'>[];
  
  // Advanced settings
  proxyTimeout?: number;
  proxyConnectTimeout?: number;
  proxyNextUpstream?: boolean;
  proxyNextUpstreamTimeout?: number;
  proxyNextUpstreamTries?: number;
  
  // Health check settings
  healthCheckEnabled?: boolean;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  healthCheckRises?: number;
  healthCheckFalls?: number;
}

export interface NLBStats {
  totalNLBs: number;
  activeNLBs: number;
  inactiveNLBs: number;
  totalUpstreams: number;
  healthyUpstreams: number;
  unhealthyUpstreams: number;
}

export interface HealthCheckResult {
  upstreamHost: string;
  upstreamPort: number;
  status: 'up' | 'down' | 'checking';
  responseTime?: number;
  error?: string;
}


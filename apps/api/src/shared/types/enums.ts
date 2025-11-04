/**
 * Shared enum types for SQLite compatibility
 * These replace the Prisma enums that are no longer available with SQLite
 */

// User-related enums
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// Activity log enums
export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CONFIG_CHANGE = 'config_change',
  USER_ACTION = 'user_action',
  SECURITY = 'security',
  SYSTEM = 'system'
}

// Domain-related enums
export enum DomainStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error'
}

export enum UpstreamStatus {
  UP = 'up',
  DOWN = 'down',
  CHECKING = 'checking'
}

export enum LoadBalancerAlgorithm {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONN = 'least_conn',
  IP_HASH = 'ip_hash'
}

export enum SSLStatus {
  VALID = 'valid',
  EXPIRING = 'expiring',
  EXPIRED = 'expired'
}

// Notification and alert enums
export enum NotificationChannelType {
  EMAIL = 'email',
  TELEGRAM = 'telegram'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

// ACL-related enums
export enum AclType {
  WHITELIST = 'whitelist',
  BLACKLIST = 'blacklist'
}

export enum AclField {
  IP = 'ip',
  GEOIP = 'geoip',
  USER_AGENT = 'user_agent',
  URL = 'url',
  METHOD = 'method',
  HEADER = 'header'
}

export enum AclOperator {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  REGEX = 'regex'
}

export enum AclAction {
  ALLOW = 'allow',
  DENY = 'deny',
  CHALLENGE = 'challenge'
}

// Access list enums
export enum AccessListType {
  IP_WHITELIST = 'ip_whitelist',
  HTTP_BASIC_AUTH = 'http_basic_auth',
  COMBINED = 'combined'
}

// Backup-related enums
export enum BackupStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RUNNING = 'running',
  PENDING = 'pending'
}

// Cluster-related enums
export enum SlaveNodeStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SYNCING = 'syncing',
  ERROR = 'error'
}

export enum SyncLogStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
  RUNNING = 'running'
}

export enum SyncLogType {
  FULL_SYNC = 'full_sync',
  INCREMENTAL_SYNC = 'incremental_sync',
  HEALTH_CHECK = 'health_check'
}

export enum NodeMode {
  MASTER = 'master',
  SLAVE = 'slave'
}

// Network Load Balancer enums
export enum NLBStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error'
}

export enum NLBProtocol {
  TCP = 'tcp',
  UDP = 'udp',
  TCP_UDP = 'tcp_udp'
}

export enum NLBAlgorithm {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONN = 'least_conn',
  IP_HASH = 'ip_hash',
  HASH = 'hash'
}

export enum NLBUpstreamStatus {
  UP = 'up',
  DOWN = 'down',
  CHECKING = 'checking'
}

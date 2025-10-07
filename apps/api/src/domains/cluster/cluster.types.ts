import { Request } from 'express';

/**
 * Slave Node Status
 */
export type SlaveNodeStatus = 'online' | 'offline' | 'syncing' | 'error';

/**
 * Slave Node Interface
 */
export interface SlaveNode {
  id: string;
  name: string;
  host: string;
  port: number;
  apiKey: string;
  status: SlaveNodeStatus;
  syncEnabled: boolean;
  syncInterval: number;
  lastSeen: Date | null;
  configHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Slave Node Response (without sensitive data)
 */
export interface SlaveNodeResponse {
  id: string;
  name: string;
  host: string;
  port: number;
  status: SlaveNodeStatus;
  syncEnabled: boolean;
  syncInterval: number;
  lastSeen: Date | null;
  configHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Slave Node Creation Response (includes API key ONCE)
 */
export interface SlaveNodeCreationResponse {
  id: string;
  name: string;
  host: string;
  port: number;
  apiKey: string;
  status: SlaveNodeStatus;
}

/**
 * Extended Request with Slave Node Info
 */
export interface SlaveRequest extends Request {
  slaveNode?: {
    id: string;
    name: string;
    host: string;
    port: number;
  };
}

/**
 * Sync Configuration Data
 */
export interface SyncConfigData {
  domains: SyncDomain[];
  sslCertificates: SyncSSLCertificate[];
  modsecCRSRules: SyncModSecCRSRule[];
  modsecCustomRules: SyncModSecCustomRule[];
  aclRules: SyncACLRule[];
  users: SyncUser[];
}

/**
 * Sync Domain
 */
export interface SyncDomain {
  name: string;
  status: string;
  sslEnabled: boolean;
  modsecEnabled: boolean;
  upstreams: SyncUpstream[];
  loadBalancer: SyncLoadBalancer | null;
}

/**
 * Sync Upstream
 */
export interface SyncUpstream {
  host: string;
  port: number;
  protocol: string;
  sslVerify: boolean;
  weight: number;
  maxFails: number;
  failTimeout: number;
}

/**
 * Sync Load Balancer
 */
export interface SyncLoadBalancer {
  algorithm: string;
  healthCheckEnabled: boolean;
  healthCheckPath: string | null;
  healthCheckInterval: number;
  healthCheckTimeout: number;
}

/**
 * Sync SSL Certificate
 */
export interface SyncSSLCertificate {
  domainName: string | null | undefined;
  commonName: string;
  sans: string[];
  issuer: string;
  certificate: string;
  privateKey: string;
  chain: string | null;
  autoRenew: boolean;
  validFrom: string;
  validTo: string;
}

/**
 * Sync ModSecurity CRS Rule
 */
export interface SyncModSecCRSRule {
  ruleFile: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  paranoia: number;
}

/**
 * Sync ModSecurity Custom Rule
 */
export interface SyncModSecCustomRule {
  name: string;
  category: string;
  ruleContent: string;
  description: string | null;
  enabled: boolean;
}

/**
 * Sync ACL Rule
 */
export interface SyncACLRule {
  name: string;
  type: string;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  action: string;
  enabled: boolean;
}

/**
 * Sync User
 */
export interface SyncUser {
  email: string;
  username: string;
  fullName: string;
  password: string; // Already hashed
  role: string;
}

/**
 * Sync Export Response
 */
export interface SyncExportResponse {
  hash: string;
  config: SyncConfigData;
}

/**
 * Import Results
 */
export interface ImportResults {
  domains: number;
  upstreams: number;
  loadBalancers: number;
  ssl: number;
  modsecCRS: number;
  modsecCustom: number;
  acl: number;
  users: number;
  totalChanges: number;
}

/**
 * Health Check Data
 */
export interface HealthCheckData {
  timestamp: string;
  nodeId: string | undefined;
  nodeName: string | undefined;
}

/**
 * Config Hash Response
 */
export interface ConfigHashResponse {
  hash: string;
}

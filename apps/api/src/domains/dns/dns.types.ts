/**
 * DNS Management Types
 * Types for AdGuardHome DNS rewrites and Cloudflare DNS records
 */

// ============ AdGuardHome Types ============

export interface AdGuardConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface AdGuardRewrite {
  domain: string;
  answer: string;
}

export interface AdGuardRewriteEntry {
  domain: string;
  answer: string;
}

// ============ Cloudflare Types ============

export interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
}

export interface CloudflareDNSRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
  proxiable: boolean;
  ttl: number;
  locked: boolean;
  created_on: string;
  modified_on: string;
  comment?: string;
  tags?: string[];
}

export interface CloudflareCreateRecord {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
}

export interface CloudflareUpdateRecord {
  type?: string;
  name?: string;
  content?: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
}

export interface CloudflareApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_count: number;
    count: number;
    total_pages: number;
  };
}

// ============ Unified DNS Types ============

export type DnsProvider = 'adguard' | 'cloudflare';

export interface UnifiedDnsRecord {
  id: string;
  provider: DnsProvider;
  domain: string;
  type: string;
  value: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
  createdAt?: string;
  modifiedAt?: string;
}

// ============ Provider Configuration Types ============

export interface DnsProviderConfig {
  provider: DnsProvider;
  enabled: boolean;
  adguard?: AdGuardConfig;
  cloudflare?: CloudflareConfig;
}

// ============ Request/Response DTOs ============

export interface CreateAdGuardRewriteDto {
  domain: string;
  answer: string;
}

export interface CreateCloudflareRecordDto {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
}

export interface UpdateCloudflareRecordDto {
  type?: string;
  name?: string;
  content?: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
}

export interface DnsConfigDto {
  provider: DnsProvider;
  enabled: boolean;
  adguard?: AdGuardConfig;
  cloudflare?: CloudflareConfig;
}

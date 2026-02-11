import api from './api';

// ============ Types ============

export interface AdGuardConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
}

export interface AdGuardRewrite {
  domain: string;
  answer: string;
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
}

export interface UnifiedDnsRecord {
  id: string;
  provider: 'adguard' | 'cloudflare';
  domain: string;
  type: string;
  value: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface DnsProviderConfig {
  provider: 'adguard' | 'cloudflare';
  enabled: boolean;
  adguard?: AdGuardConfig;
  cloudflare?: CloudflareConfig;
}

// ============ AdGuardHome Service ============

export const adguardDnsService = {
  getRewrites: async (config: AdGuardConfig): Promise<AdGuardRewrite[]> => {
    const response = await api.post('/dns/adguard/rewrites', config);
    return response.data.data;
  },

  addRewrite: async (config: AdGuardConfig, rewrite: AdGuardRewrite): Promise<void> => {
    await api.post('/dns/adguard/rewrites/add', {
      ...config,
      ...rewrite,
    });
  },

  updateRewrite: async (
    config: AdGuardConfig,
    oldRewrite: AdGuardRewrite,
    newRewrite: AdGuardRewrite
  ): Promise<void> => {
    await api.put('/dns/adguard/rewrites', {
      ...config,
      oldDomain: oldRewrite.domain,
      oldAnswer: oldRewrite.answer,
      domain: newRewrite.domain,
      answer: newRewrite.answer,
    });
  },

  deleteRewrite: async (config: AdGuardConfig, rewrite: AdGuardRewrite): Promise<void> => {
    await api.post('/dns/adguard/rewrites/delete', {
      ...config,
      ...rewrite,
    });
  },
};

// ============ Cloudflare Service ============

export const cloudflareDnsService = {
  getRecords: async (config: CloudflareConfig): Promise<CloudflareDNSRecord[]> => {
    const response = await api.post('/dns/cloudflare/records', config);
    return response.data.data;
  },

  createRecord: async (
    config: CloudflareConfig,
    record: { type: string; name: string; content: string; ttl?: number; proxied?: boolean; comment?: string }
  ): Promise<CloudflareDNSRecord> => {
    const response = await api.post('/dns/cloudflare/records/add', {
      ...config,
      ...record,
    });
    return response.data.data;
  },

  updateRecord: async (
    config: CloudflareConfig,
    recordId: string,
    record: { type?: string; name?: string; content?: string; ttl?: number; proxied?: boolean; comment?: string }
  ): Promise<CloudflareDNSRecord> => {
    const response = await api.put(`/dns/cloudflare/records/${recordId}`, {
      ...config,
      ...record,
    });
    return response.data.data;
  },

  deleteRecord: async (config: CloudflareConfig, recordId: string): Promise<void> => {
    await api.post(`/dns/cloudflare/records/${recordId}/delete`, config);
  },
};

// ============ Unified DNS Service ============

export const dnsService = {
  getAllRecords: async (configs: DnsProviderConfig[]): Promise<UnifiedDnsRecord[]> => {
    const response = await api.post('/dns/records', { configs });
    return response.data.data;
  },

  testConnection: async (config: DnsProviderConfig): Promise<{ connected: boolean }> => {
    const response = await api.post('/dns/test-connection', config);
    return response.data.data;
  },
};

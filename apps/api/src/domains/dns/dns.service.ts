/**
 * DNS Management Service
 * Business logic for AdGuardHome and Cloudflare DNS management
 */

import logger from '../../utils/logger';
import type {
  AdGuardConfig,
  AdGuardRewrite,
  CloudflareConfig,
  CloudflareDNSRecord,
  CloudflareApiResponse,
  CloudflareCreateRecord,
  CloudflareUpdateRecord,
  UnifiedDnsRecord,
  DnsProviderConfig,
} from './dns.types';

// ============ AdGuardHome Service ============

export class AdGuardService {
  /**
   * Get all DNS rewrites from AdGuardHome
   */
  async getRewrites(config: AdGuardConfig): Promise<AdGuardRewrite[]> {
    const url = `${config.baseUrl.replace(/\/$/, '')}/control/rewrite/list`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AdGuardHome API error: ${response.status} - ${errorText}`);
    }

    return await response.json() as AdGuardRewrite[];
  }

  /**
   * Add a DNS rewrite to AdGuardHome
   */
  async addRewrite(config: AdGuardConfig, rewrite: AdGuardRewrite): Promise<void> {
    const url = `${config.baseUrl.replace(/\/$/, '')}/control/rewrite/add`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rewrite),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AdGuardHome API error: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Delete a DNS rewrite from AdGuardHome
   */
  async deleteRewrite(config: AdGuardConfig, rewrite: AdGuardRewrite): Promise<void> {
    const url = `${config.baseUrl.replace(/\/$/, '')}/control/rewrite/delete`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rewrite),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AdGuardHome API error: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Update a DNS rewrite (delete old + add new)
   */
  async updateRewrite(
    config: AdGuardConfig,
    oldRewrite: AdGuardRewrite,
    newRewrite: AdGuardRewrite
  ): Promise<void> {
    await this.deleteRewrite(config, oldRewrite);
    await this.addRewrite(config, newRewrite);
  }

  /**
   * Test connection to AdGuardHome
   */
  async testConnection(config: AdGuardConfig): Promise<boolean> {
    try {
      const url = `${config.baseUrl.replace(/\/$/, '')}/control/status`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============ Cloudflare Service ============

export class CloudflareService {
  /**
   * Get all DNS records from Cloudflare zone
   */
  async getRecords(config: CloudflareConfig): Promise<CloudflareDNSRecord[]> {
    const allRecords: CloudflareDNSRecord[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records?page=${page}&per_page=100`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as CloudflareApiResponse<CloudflareDNSRecord[]>;

      if (!data.success) {
        throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(', ')}`);
      }

      allRecords.push(...data.result);

      if (data.result_info) {
        totalPages = data.result_info.total_pages;
      }
      page++;
    }

    return allRecords;
  }

  /**
   * Get a single DNS record from Cloudflare
   */
  async getRecord(config: CloudflareConfig, recordId: string): Promise<CloudflareDNSRecord> {
    const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as CloudflareApiResponse<CloudflareDNSRecord>;

    if (!data.success) {
      throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data.result;
  }

  /**
   * Create a DNS record in Cloudflare
   */
  async createRecord(
    config: CloudflareConfig,
    record: CloudflareCreateRecord
  ): Promise<CloudflareDNSRecord> {
    const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as CloudflareApiResponse<CloudflareDNSRecord>;

    if (!data.success) {
      throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data.result;
  }

  /**
   * Update a DNS record in Cloudflare
   */
  async updateRecord(
    config: CloudflareConfig,
    recordId: string,
    record: CloudflareUpdateRecord
  ): Promise<CloudflareDNSRecord> {
    const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as CloudflareApiResponse<CloudflareDNSRecord>;

    if (!data.success) {
      throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data.result;
  }

  /**
   * Delete a DNS record from Cloudflare
   */
  async deleteRecord(config: CloudflareConfig, recordId: string): Promise<void> {
    const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Test connection to Cloudflare
   */
  async testConnection(config: CloudflareConfig): Promise<boolean> {
    try {
      const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============ DNS Aggregation Service ============

export class DnsManagementService {
  private adguardService: AdGuardService;
  private cloudflareService: CloudflareService;

  constructor() {
    this.adguardService = new AdGuardService();
    this.cloudflareService = new CloudflareService();
  }

  /**
   * Get all DNS records from all configured providers
   */
  async getAllRecords(configs: DnsProviderConfig[]): Promise<UnifiedDnsRecord[]> {
    const records: UnifiedDnsRecord[] = [];
    const errors: Array<{ provider: string; error: string }> = [];

    for (const cfg of configs) {
      if (!cfg.enabled) continue;

      try {
        if (cfg.provider === 'adguard' && cfg.adguard) {
          const rewrites = await this.adguardService.getRewrites(cfg.adguard);
          const unified = rewrites.map((r, index) => this.adguardToUnified(r, index));
          records.push(...unified);
        } else if (cfg.provider === 'cloudflare' && cfg.cloudflare) {
          const cfRecords = await this.cloudflareService.getRecords(cfg.cloudflare);
          const unified = cfRecords.map(r => this.cloudflareToUnified(r));
          records.push(...unified);
        }
      } catch (error: any) {
        logger.error(`Failed to fetch DNS records from ${cfg.provider}:`, error);
        errors.push({ provider: cfg.provider, error: error.message });
      }
    }

    return records;
  }

  /**
   * Convert AdGuardHome rewrite to unified format
   */
  private adguardToUnified(rewrite: AdGuardRewrite, index: number): UnifiedDnsRecord {
    // Determine record type based on the answer format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^[0-9a-fA-F:]+$/;

    let type = 'CNAME';
    if (ipv4Regex.test(rewrite.answer)) {
      type = 'A';
    } else if (ipv6Regex.test(rewrite.answer) && rewrite.answer.includes(':')) {
      type = 'AAAA';
    }

    return {
      id: `adguard-${index}-${Buffer.from(rewrite.domain + ':' + rewrite.answer).toString('base64url').substring(0, 32)}`,
      provider: 'adguard',
      domain: rewrite.domain,
      type,
      value: rewrite.answer,
    };
  }

  /**
   * Convert Cloudflare DNS record to unified format
   */
  private cloudflareToUnified(record: CloudflareDNSRecord): UnifiedDnsRecord {
    return {
      id: `cloudflare-${record.id}`,
      provider: 'cloudflare',
      domain: record.name,
      type: record.type,
      value: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      comment: record.comment,
      createdAt: record.created_on,
      modifiedAt: record.modified_on,
    };
  }

  /**
   * Test provider connection
   */
  async testConnection(config: DnsProviderConfig): Promise<boolean> {
    if (config.provider === 'adguard' && config.adguard) {
      return this.adguardService.testConnection(config.adguard);
    } else if (config.provider === 'cloudflare' && config.cloudflare) {
      return this.cloudflareService.testConnection(config.cloudflare);
    }
    return false;
  }
}

// Export singleton instances
export const adguardService = new AdGuardService();
export const cloudflareService = new CloudflareService();
export const dnsManagementService = new DnsManagementService();

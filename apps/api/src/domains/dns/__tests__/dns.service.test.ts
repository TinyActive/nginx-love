/**
 * DNS Service Tests
 * Unit tests for AdGuardHome, Cloudflare, and DNS management services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdGuardService, CloudflareService, DnsManagementService } from '../dns.service';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdGuardService', () => {
  let service: AdGuardService;
  const config = {
    baseUrl: 'http://adguard.local',
    username: 'admin',
    password: 'password',
  };

  beforeEach(() => {
    service = new AdGuardService();
    vi.clearAllMocks();
  });

  describe('getRewrites', () => {
    it('should return rewrites from AdGuardHome', async () => {
      const mockRewrites = [
        { domain: 'example.local', answer: '192.168.1.100' },
        { domain: 'app.local', answer: '192.168.1.101' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRewrites,
      });

      const result = await service.getRewrites(config);

      expect(result).toEqual(mockRewrites);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://adguard.local/control/rewrite/list',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
          }),
        })
      );
    });

    it('should throw error when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(service.getRewrites(config)).rejects.toThrow('AdGuardHome API error: 401');
    });

    it('should strip trailing slash from baseUrl', async () => {
      const configWithSlash = { ...config, baseUrl: 'http://adguard.local/' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await service.getRewrites(configWithSlash);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://adguard.local/control/rewrite/list',
        expect.any(Object)
      );
    });
  });

  describe('addRewrite', () => {
    it('should add a rewrite entry', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await service.addRewrite(config, { domain: 'test.local', answer: '10.0.0.1' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://adguard.local/control/rewrite/add',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ domain: 'test.local', answer: '10.0.0.1' }),
        })
      );
    });

    it('should throw error when add fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      });

      await expect(
        service.addRewrite(config, { domain: 'test.local', answer: '10.0.0.1' })
      ).rejects.toThrow('AdGuardHome API error: 500');
    });
  });

  describe('deleteRewrite', () => {
    it('should delete a rewrite entry', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await service.deleteRewrite(config, { domain: 'test.local', answer: '10.0.0.1' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://adguard.local/control/rewrite/delete',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ domain: 'test.local', answer: '10.0.0.1' }),
        })
      );
    });
  });

  describe('updateRewrite', () => {
    it('should delete old and add new rewrite', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // delete
        .mockResolvedValueOnce({ ok: true }); // add

      await service.updateRewrite(
        config,
        { domain: 'old.local', answer: '10.0.0.1' },
        { domain: 'new.local', answer: '10.0.0.2' }
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('testConnection', () => {
    it('should return true when connection succeeds', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await service.testConnection(config);

      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await service.testConnection(config);

      expect(result).toBe(false);
    });

    it('should return false when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.testConnection(config);

      expect(result).toBe(false);
    });
  });
});

describe('CloudflareService', () => {
  let service: CloudflareService;
  const config = {
    apiToken: 'test-api-token',
    zoneId: 'test-zone-id',
  };

  beforeEach(() => {
    service = new CloudflareService();
    vi.clearAllMocks();
  });

  describe('getRecords', () => {
    it('should return DNS records from Cloudflare', async () => {
      const mockRecords = [
        { id: '1', name: 'example.com', type: 'A', content: '1.2.3.4' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: mockRecords,
          result_info: { page: 1, per_page: 100, total_count: 1, count: 1, total_pages: 1 },
        }),
      });

      const result = await service.getRecords(config);

      expect(result).toEqual(mockRecords);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`zones/${config.zoneId}/dns_records`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${config.apiToken}`,
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            result: [{ id: '1', name: 'a.com' }],
            result_info: { page: 1, per_page: 100, total_count: 2, count: 1, total_pages: 2 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            result: [{ id: '2', name: 'b.com' }],
            result_info: { page: 2, per_page: 100, total_count: 2, count: 1, total_pages: 2 },
          }),
        });

      const result = await service.getRecords(config);

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          errors: [{ code: 1000, message: 'Invalid zone' }],
          result: [],
        }),
      });

      await expect(service.getRecords(config)).rejects.toThrow('Cloudflare API error: Invalid zone');
    });
  });

  describe('createRecord', () => {
    it('should create a DNS record', async () => {
      const newRecord = { type: 'A', name: 'test.example.com', content: '5.6.7.8' };
      const createdRecord = { id: '123', ...newRecord };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, result: createdRecord }),
      });

      const result = await service.createRecord(config, newRecord);

      expect(result).toEqual(createdRecord);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`zones/${config.zoneId}/dns_records`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newRecord),
        })
      );
    });
  });

  describe('updateRecord', () => {
    it('should update a DNS record', async () => {
      const updatedData = { content: '9.10.11.12' };
      const updatedRecord = { id: '123', name: 'test.example.com', type: 'A', content: '9.10.11.12' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, result: updatedRecord }),
      });

      const result = await service.updateRecord(config, '123', updatedData);

      expect(result).toEqual(updatedRecord);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`dns_records/123`),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  describe('deleteRecord', () => {
    it('should delete a DNS record', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await service.deleteRecord(config, '123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`dns_records/123`),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('testConnection', () => {
    it('should return true when zone is accessible', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await service.testConnection(config);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.testConnection(config);

      expect(result).toBe(false);
    });
  });
});

describe('DnsManagementService', () => {
  let service: DnsManagementService;

  beforeEach(() => {
    service = new DnsManagementService();
    vi.clearAllMocks();
  });

  describe('getAllRecords', () => {
    it('should aggregate records from multiple providers', async () => {
      // Mock AdGuard response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { domain: 'internal.local', answer: '192.168.1.100' },
        ],
      });

      // Mock Cloudflare response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: [
            { id: 'cf1', name: 'example.com', type: 'A', content: '1.2.3.4', created_on: '2024-01-01', modified_on: '2024-01-01' },
          ],
          result_info: { page: 1, per_page: 100, total_count: 1, count: 1, total_pages: 1 },
        }),
      });

      const configs: DnsProviderConfig[] = [
        {
          provider: 'adguard',
          enabled: true,
          adguard: { baseUrl: 'http://adguard.local', username: 'admin', password: 'pass' },
        },
        {
          provider: 'cloudflare',
          enabled: true,
          cloudflare: { apiToken: 'token', zoneId: 'zone123' },
        },
      ];

      const records = await service.getAllRecords(configs);

      expect(records).toHaveLength(2);
      expect(records[0].provider).toBe('adguard');
      expect(records[1].provider).toBe('cloudflare');
    });

    it('should skip disabled providers', async () => {
      const configs: DnsProviderConfig[] = [
        {
          provider: 'adguard',
          enabled: false,
          adguard: { baseUrl: 'http://adguard.local', username: 'admin', password: 'pass' },
        },
      ];

      const records = await service.getAllRecords(configs);

      expect(records).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should continue on provider errors and return partial results', async () => {
      // Mock AdGuard failure
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      // Mock Cloudflare success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: [
            { id: 'cf1', name: 'example.com', type: 'A', content: '1.2.3.4', created_on: '2024-01-01', modified_on: '2024-01-01' },
          ],
          result_info: { page: 1, per_page: 100, total_count: 1, count: 1, total_pages: 1 },
        }),
      });

      const configs: DnsProviderConfig[] = [
        {
          provider: 'adguard',
          enabled: true,
          adguard: { baseUrl: 'http://adguard.local', username: 'admin', password: 'pass' },
        },
        {
          provider: 'cloudflare',
          enabled: true,
          cloudflare: { apiToken: 'token', zoneId: 'zone123' },
        },
      ];

      const records = await service.getAllRecords(configs);

      // Should still return Cloudflare records despite AdGuard failure
      expect(records).toHaveLength(1);
      expect(records[0].provider).toBe('cloudflare');
    });
  });

  describe('testConnection', () => {
    it('should test AdGuard connection', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await service.testConnection({
        provider: 'adguard',
        enabled: true,
        adguard: { baseUrl: 'http://adguard.local', username: 'admin', password: 'pass' },
      });

      expect(result).toBe(true);
    });

    it('should test Cloudflare connection', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await service.testConnection({
        provider: 'cloudflare',
        enabled: true,
        cloudflare: { apiToken: 'token', zoneId: 'zone123' },
      });

      expect(result).toBe(true);
    });

    it('should return false for unconfigured provider', async () => {
      const result = await service.testConnection({
        provider: 'adguard',
        enabled: true,
      });

      expect(result).toBe(false);
    });
  });
});

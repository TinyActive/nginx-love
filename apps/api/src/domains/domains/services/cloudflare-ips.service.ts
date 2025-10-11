import logger from '../../../utils/logger';

/**
 * Service for fetching Cloudflare IP ranges
 */
export class CloudflareIpsService {
  private static readonly IPV4_URL = 'https://www.cloudflare.com/ips-v4';
  private static readonly IPV6_URL = 'https://www.cloudflare.com/ips-v6';
  
  // Fallback IPs if fetch fails
  private static readonly FALLBACK_IPV4 = [
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
  ];

  private static readonly FALLBACK_IPV6 = [
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32',
  ];

  // Cache for IPs (valid for 24 hours)
  private static cachedIPs: string[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get Cloudflare IPs (IPv4 + IPv6)
   * Tries to fetch from Cloudflare, falls back to hardcoded list
   */
  async getCloudflareIPs(): Promise<string[]> {
    // Check cache first
    if (CloudflareIpsService.cachedIPs && 
        Date.now() - CloudflareIpsService.cacheTimestamp < CloudflareIpsService.CACHE_TTL) {
      logger.info('Using cached Cloudflare IPs');
      return CloudflareIpsService.cachedIPs;
    }

    // Try to fetch fresh IPs
    try {
      const [ipv4List, ipv6List] = await Promise.all([
        this.fetchIPs(CloudflareIpsService.IPV4_URL),
        this.fetchIPs(CloudflareIpsService.IPV6_URL),
      ]);

      const allIPs = [...ipv4List, ...ipv6List];

      if (allIPs.length > 0) {
        // Update cache
        CloudflareIpsService.cachedIPs = allIPs;
        CloudflareIpsService.cacheTimestamp = Date.now();
        logger.info(`Fetched ${allIPs.length} Cloudflare IPs successfully`);
        return allIPs;
      }

      throw new Error('No IPs fetched');
    } catch (error) {
      logger.warn('Failed to fetch Cloudflare IPs, using fallback list', error);
      return this.getFallbackIPs();
    }
  }

  /**
   * Fetch IPs from a URL
   */
  private async fetchIPs(url: string): Promise<string[]> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'nginx-love/1.0',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } catch (error) {
      logger.error(`Failed to fetch from ${url}:`, error);
      return [];
    }
  }

  /**
   * Get fallback IPs (hardcoded list)
   */
  private getFallbackIPs(): string[] {
    return [
      ...CloudflareIpsService.FALLBACK_IPV4,
      ...CloudflareIpsService.FALLBACK_IPV6,
    ];
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(): void {
    CloudflareIpsService.cachedIPs = null;
    CloudflareIpsService.cacheTimestamp = 0;
    logger.info('Cloudflare IPs cache cleared');
  }
}

// Export singleton instance
export const cloudflareIpsService = new CloudflareIpsService();
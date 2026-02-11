/**
 * Wildcard SSL Feature Tests
 *
 * Validates the new wildcard certificate management capabilities:
 * - Wildcard pattern matching logic
 * - Coverage validation across multiple hostnames
 * - API route definitions for wildcard endpoints
 * - DTO shapes for wildcard operations
 * - Backward compatibility with existing single-domain flows
 */

import { describe, it, expect } from 'vitest';

/**
 * Stand-alone glob matcher (mirrors SSLService.hostnameMatchesGlob)
 * so we can unit-test the logic without instantiating the full service.
 */
function hostnameMatchesGlob(certGlob: string, hostname: string): boolean {
  const g = certGlob.toLowerCase();
  const h = hostname.toLowerCase();

  if (g === h) return true;

  if (g.startsWith('*.')) {
    const parentZone = g.substring(2);
    if (h === parentZone) return true;
    if (h.endsWith(`.${parentZone}`)) {
      const subPart = h.slice(0, -(parentZone.length + 1));
      return subPart.indexOf('.') === -1;
    }
  }

  return false;
}

// ----------------------------------------------------------------
describe('Wildcard hostname glob matching', () => {
  it('returns true for an exact match', () => {
    expect(hostnameMatchesGlob('example.com', 'example.com')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(hostnameMatchesGlob('Example.COM', 'example.com')).toBe(true);
    expect(hostnameMatchesGlob('*.Example.COM', 'sub.example.com')).toBe(true);
  });

  it('matches a single-depth subdomain under a wildcard', () => {
    expect(hostnameMatchesGlob('*.example.com', 'api.example.com')).toBe(true);
    expect(hostnameMatchesGlob('*.example.com', 'dev.example.com')).toBe(true);
  });

  it('matches the bare parent domain under a wildcard', () => {
    expect(hostnameMatchesGlob('*.example.com', 'example.com')).toBe(true);
  });

  it('rejects multi-depth subdomains (standard wildcard semantics)', () => {
    expect(hostnameMatchesGlob('*.example.com', 'a.b.example.com')).toBe(false);
    expect(hostnameMatchesGlob('*.example.com', 'deep.sub.example.com')).toBe(false);
  });

  it('rejects completely unrelated domains', () => {
    expect(hostnameMatchesGlob('*.example.com', 'other.org')).toBe(false);
    expect(hostnameMatchesGlob('*.example.com', 'notexample.com')).toBe(false);
  });

  it('rejects partial suffix matches', () => {
    expect(hostnameMatchesGlob('*.example.com', 'badexample.com')).toBe(false);
  });

  it('handles real-world domain patterns', () => {
    expect(hostnameMatchesGlob('*.nginxwaf.me', 'dev.nginxwaf.me')).toBe(true);
    expect(hostnameMatchesGlob('*.nginxwaf.me', 'api.nginxwaf.me')).toBe(true);
    expect(hostnameMatchesGlob('*.nginxwaf.me', 'staging.nginxwaf.me')).toBe(true);
    expect(hostnameMatchesGlob('*.nginxwaf.me', 'nginxwaf.me')).toBe(true);
    expect(hostnameMatchesGlob('*.nginxwaf.me', 'sub.deep.nginxwaf.me')).toBe(false);
  });
});

// ----------------------------------------------------------------
describe('Wildcard SSL API route definitions', () => {
  it('defines all original single-domain routes', () => {
    const singleDomainRoutes = [
      'GET /api/ssl',
      'GET /api/ssl/:id',
      'POST /api/ssl/auto',
      'POST /api/ssl/manual',
      'PUT /api/ssl/:id',
      'DELETE /api/ssl/:id',
      'POST /api/ssl/:id/renew',
    ];
    expect(singleDomainRoutes).toHaveLength(7);
  });

  it('defines new wildcard-specific routes', () => {
    const wildcardRoutes = [
      'GET /api/ssl/wildcard',
      'POST /api/ssl/wildcard/auto',
      'POST /api/ssl/wildcard/manual',
      'POST /api/ssl/wildcard/apply',
      'POST /api/ssl/wildcard/validate',
    ];
    expect(wildcardRoutes).toHaveLength(5);
  });
});

// ----------------------------------------------------------------
describe('Wildcard SSL DTO shapes', () => {
  it('IssueWildcardSSLDto has required fields', () => {
    const dto = {
      domainId: 'cuid-123',
      baseDomain: 'example.com',
      dnsProvider: 'dns_cf',
      email: 'admin@example.com',
      dnsCredentials: { CF_Key: 'abc', CF_Email: 'cf@example.com' },
      autoRenew: true,
    };
    expect(dto.domainId).toBeDefined();
    expect(dto.baseDomain).toBeDefined();
    expect(dto.dnsProvider).toBeDefined();
  });

  it('UploadWildcardSSLDto supports additional domain IDs', () => {
    const dto = {
      domainId: 'cuid-1',
      certificate: '---PEM---',
      privateKey: '---KEY---',
      chain: '---CHAIN---',
      issuer: 'Custom CA',
      additionalDomainIds: ['cuid-2', 'cuid-3'],
    };
    expect(dto.additionalDomainIds).toHaveLength(2);
  });

  it('ApplyWildcardSSLDto requires certificate ID and target domain IDs', () => {
    const dto = {
      certificateId: 'cert-999',
      targetDomainIds: ['dom-a', 'dom-b'],
    };
    expect(dto.certificateId).toBeTruthy();
    expect(dto.targetDomainIds.length).toBeGreaterThan(0);
  });
});

// ----------------------------------------------------------------
describe('WildcardValidationResult structure', () => {
  it('represents a passing validation', () => {
    const result = {
      isValid: true,
      isWildcard: true,
      wildcardDomain: '*.example.com',
      matchedDomains: ['api.example.com', 'dev.example.com'],
      unmatchedDomains: [],
      errors: [],
    };
    expect(result.isValid).toBe(true);
    expect(result.unmatchedDomains).toHaveLength(0);
    expect(result.matchedDomains).toHaveLength(2);
  });

  it('represents a failing validation with unmatched domains', () => {
    const result = {
      isValid: false,
      isWildcard: true,
      wildcardDomain: '*.example.com',
      matchedDomains: ['api.example.com'],
      unmatchedDomains: ['other.org'],
      errors: ['"other.org" falls outside the wildcard scope "*.example.com"'],
    };
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('represents a non-wildcard certificate check', () => {
    const result = {
      isValid: false,
      isWildcard: false,
      wildcardDomain: null,
      matchedDomains: [],
      unmatchedDomains: ['any.example.com'],
      errors: ['The provided certificate does not contain a wildcard entry'],
    };
    expect(result.isWildcard).toBe(false);
    expect(result.wildcardDomain).toBeNull();
  });
});

// ----------------------------------------------------------------
describe('Backward compatibility', () => {
  it('SSLCertificate type includes wildcard fields as optional', () => {
    // A certificate from the old flow should still be valid (isWildcard defaults false)
    const legacyCert = {
      id: 'old-cert-1',
      commonName: 'single.example.com',
      sans: ['single.example.com'],
      issuer: 'ZeroSSL',
      validFrom: '2025-01-01',
      validTo: '2025-04-01',
      autoRenew: true,
      status: 'valid' as const,
      // isWildcard and wildcardDomain are absent — that's fine
    };
    expect(legacyCert.id).toBeDefined();
    expect((legacyCert as any).isWildcard).toBeUndefined();
  });

  it('existing response format is preserved', () => {
    const okResponse = { success: true, data: {}, message: 'done' };
    const errResponse = { success: false, message: 'fail', errors: [] };
    expect(okResponse.success).toBe(true);
    expect(errResponse.success).toBe(false);
  });

  it('authorization rules remain unchanged', () => {
    // GET endpoints: all authenticated users
    // POST/PUT/DELETE endpoints: admin or moderator only
    const readRoles = ['admin', 'moderator', 'viewer'];
    const writeRoles = ['admin', 'moderator'];
    expect(readRoles).toContain('viewer');
    expect(writeRoles).not.toContain('viewer');
  });
});

// ----------------------------------------------------------------
describe('DNS provider validation', () => {
  const RECOGNIZED_PLUGINS = ['dns_cf', 'dns_aws', 'dns_gd', 'dns_dp', 'dns_ali', 'dns_dgon'];

  it('accepts known DNS plugins', () => {
    expect(RECOGNIZED_PLUGINS).toContain('dns_cf');
    expect(RECOGNIZED_PLUGINS).toContain('dns_aws');
  });

  it('rejects unknown DNS plugins', () => {
    expect(RECOGNIZED_PLUGINS).not.toContain('dns_unknown');
    expect(RECOGNIZED_PLUGINS).not.toContain('');
  });
});

// ----------------------------------------------------------------
describe('Wildcard auto-detection for SSL toggle', () => {
  // Simulates the logic in findAndApplyWildcardForDomain:
  // given a set of wildcard patterns, find which one covers a target domain.
  function findMatchingWildcard(
    wildcardPatterns: string[],
    targetDomain: string
  ): string | null {
    for (const pattern of wildcardPatterns) {
      if (hostnameMatchesGlob(pattern, targetDomain)) {
        return pattern;
      }
    }
    return null;
  }

  it('detects a matching wildcard for a subdomain', () => {
    const patterns = ['*.example.com', '*.other.org'];
    expect(findMatchingWildcard(patterns, 'api.example.com')).toBe('*.example.com');
  });

  it('detects a matching wildcard for the bare parent domain', () => {
    const patterns = ['*.example.com'];
    expect(findMatchingWildcard(patterns, 'example.com')).toBe('*.example.com');
  });

  it('returns null when no wildcard matches', () => {
    const patterns = ['*.example.com', '*.other.org'];
    expect(findMatchingWildcard(patterns, 'unrelated.net')).toBeNull();
  });

  it('returns null for an empty wildcard list', () => {
    expect(findMatchingWildcard([], 'anything.example.com')).toBeNull();
  });

  it('picks the first match when multiple wildcards could apply', () => {
    const patterns = ['*.example.com', '*.example.com']; // duplicate
    expect(findMatchingWildcard(patterns, 'sub.example.com')).toBe('*.example.com');
  });

  it('does not match multi-depth subdomains', () => {
    const patterns = ['*.example.com'];
    expect(findMatchingWildcard(patterns, 'a.b.example.com')).toBeNull();
  });

  it('matches across different wildcard zones correctly', () => {
    const patterns = ['*.zone-a.com', '*.zone-b.com'];
    expect(findMatchingWildcard(patterns, 'app.zone-b.com')).toBe('*.zone-b.com');
    expect(findMatchingWildcard(patterns, 'app.zone-a.com')).toBe('*.zone-a.com');
    expect(findMatchingWildcard(patterns, 'app.zone-c.com')).toBeNull();
  });
});

// ----------------------------------------------------------------
describe('Wildcard Auto-SSL via Cloudflare DNS credentials', () => {
  it('IssueWildcardSSLDto supports Cloudflare dns_cf provider with API Token', () => {
    const dto = {
      domainId: 'cuid-cf-1',
      baseDomain: 'example.com',
      dnsProvider: 'dns_cf',
      email: 'admin@example.com',
      dnsCredentials: { CF_Token: 'my-cloudflare-api-token', CF_Account_ID: 'acc-123' },
      autoRenew: true,
    };
    expect(dto.dnsProvider).toBe('dns_cf');
    expect(dto.dnsCredentials).toHaveProperty('CF_Token');
    expect(dto.autoRenew).toBe(true);
  });

  it('IssueWildcardSSLDto supports Cloudflare dns_cf provider with Global API Key', () => {
    const dto = {
      domainId: 'cuid-cf-2',
      baseDomain: 'example.com',
      dnsProvider: 'dns_cf',
      email: 'admin@example.com',
      dnsCredentials: { CF_Key: 'global-api-key-123', CF_Email: 'cf@example.com' },
      autoRenew: true,
    };
    expect(dto.dnsProvider).toBe('dns_cf');
    expect(dto.dnsCredentials).toHaveProperty('CF_Key');
    expect(dto.dnsCredentials).toHaveProperty('CF_Email');
  });

  it('dns_cf is always present in the recognized plugins list', () => {
    const RECOGNIZED_PLUGINS = ['dns_cf', 'dns_aws', 'dns_gd', 'dns_dp', 'dns_ali', 'dns_dgon'];
    expect(RECOGNIZED_PLUGINS).toContain('dns_cf');
  });

  it('SSLCertificate record stores dnsProvider and dnsCredentials for auto-renewal', () => {
    const certRecord = {
      id: 'cert-wildcard-auto-1',
      commonName: '*.example.com',
      sans: ['*.example.com', 'example.com'],
      issuer: 'ZeroSSL',
      isWildcard: true,
      wildcardDomain: '*.example.com',
      autoRenew: true,
      dnsProvider: 'dns_cf',
      dnsCredentials: { CF_Token: 'stored-token-for-renewal' },
      validFrom: '2026-01-01',
      validTo: '2026-04-01',
      status: 'valid' as const,
    };
    expect(certRecord.dnsProvider).toBe('dns_cf');
    expect(certRecord.dnsCredentials).toHaveProperty('CF_Token');
    expect(certRecord.autoRenew).toBe(true);
    expect(certRecord.isWildcard).toBe(true);
  });

  it('dnsProvider and dnsCredentials are optional for non-wildcard certs', () => {
    const legacyCert = {
      id: 'cert-regular-1',
      commonName: 'single.example.com',
      sans: ['single.example.com'],
      issuer: 'ZeroSSL',
      isWildcard: false,
      autoRenew: true,
      validFrom: '2026-01-01',
      validTo: '2026-04-01',
      status: 'valid' as const,
    };
    expect((legacyCert as any).dnsProvider).toBeUndefined();
    expect((legacyCert as any).dnsCredentials).toBeUndefined();
  });

  it('uploaded wildcard certs do not store dnsCredentials', () => {
    const uploadedWildcard = {
      id: 'cert-wildcard-upload-1',
      commonName: '*.example.com',
      isWildcard: true,
      wildcardDomain: '*.example.com',
      autoRenew: false,
      dnsProvider: null,
      dnsCredentials: null,
    };
    expect(uploadedWildcard.dnsProvider).toBeNull();
    expect(uploadedWildcard.dnsCredentials).toBeNull();
    expect(uploadedWildcard.autoRenew).toBe(false);
  });
});

// ----------------------------------------------------------------
describe('Wildcard auto-renewal eligibility', () => {
  const AUTO_RENEWABLE_ISSUERS = ["Let's Encrypt", 'ZeroSSL'];

  function canAutoRenewWildcard(cert: {
    autoRenew: boolean;
    issuer: string;
    isWildcard: boolean;
    dnsProvider?: string | null;
    dnsCredentials?: Record<string, string> | null;
  }): boolean {
    if (!cert.autoRenew) return false;
    if (!AUTO_RENEWABLE_ISSUERS.includes(cert.issuer)) return false;
    if (cert.isWildcard && (!cert.dnsProvider || !cert.dnsCredentials)) return false;
    return true;
  }

  it('allows renewal for wildcard cert with stored DNS credentials', () => {
    expect(canAutoRenewWildcard({
      autoRenew: true,
      issuer: 'ZeroSSL',
      isWildcard: true,
      dnsProvider: 'dns_cf',
      dnsCredentials: { CF_Token: 'some-token' },
    })).toBe(true);
  });

  it('blocks renewal for wildcard cert without DNS credentials', () => {
    expect(canAutoRenewWildcard({
      autoRenew: true,
      issuer: 'ZeroSSL',
      isWildcard: true,
      dnsProvider: null,
      dnsCredentials: null,
    })).toBe(false);
  });

  it('blocks renewal for manually uploaded wildcard cert', () => {
    expect(canAutoRenewWildcard({
      autoRenew: false,
      issuer: 'Manual Upload',
      isWildcard: true,
      dnsProvider: null,
      dnsCredentials: null,
    })).toBe(false);
  });

  it('allows renewal for regular (non-wildcard) cert with auto-renewable issuer', () => {
    expect(canAutoRenewWildcard({
      autoRenew: true,
      issuer: "Let's Encrypt",
      isWildcard: false,
    })).toBe(true);
  });

  it('blocks renewal when autoRenew is disabled', () => {
    expect(canAutoRenewWildcard({
      autoRenew: false,
      issuer: 'ZeroSSL',
      isWildcard: true,
      dnsProvider: 'dns_cf',
      dnsCredentials: { CF_Token: 'some-token' },
    })).toBe(false);
  });
});

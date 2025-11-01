import { SSLCertificate, Domain } from '@prisma/client';

/**
 * SSL Certificate with related domain information
 */
export interface SSLCertificateWithDomain extends SSLCertificate {
  domain: {
    id: string;
    name: string;
    status: string;
  };
}

/**
 * SSL Certificate with computed status
 */
export interface SSLCertificateWithStatus extends SSLCertificateWithDomain {
  daysUntilExpiry: number;
}

/**
 * Certificate files returned by ACME operations
 */
export interface CertificateFiles {
  certificate: string;
  privateKey: string;
  chain: string;
  fullchain: string;
}

/**
 * Options for ACME certificate issuance
 */
export interface AcmeOptions {
  domain: string;
  sans?: string[];
  email?: string;
  webroot?: string;
  dns?: string;
  standalone?: boolean;
}

/**
 * Parsed certificate information
 */
export interface ParsedCertificate {
  commonName: string;
  sans: string[];
  issuer: string;
  issuerDetails: {
    commonName: string;
    organization?: string;
    country?: string;
  };
  subject: string;
  subjectDetails: {
    commonName: string;
    organization?: string;
    country?: string;
  };
  validFrom: Date;
  validTo: Date;
  serialNumber?: string;
}

/**
 * SSL Certificate status types
 */
export type SSLStatus = 'valid' | 'expiring' | 'expired';

/**
 * Constants for SSL operations
 */
export const SSL_CONSTANTS = {
  CERTS_PATH: '/etc/nginx/ssl',
  EXPIRING_THRESHOLD_DAYS: 30,
  LETSENCRYPT_ISSUER: "Let's Encrypt",
  ZEROSSL_ISSUER: 'ZeroSSL',
  MANUAL_ISSUER: 'Manual Upload',
  // List of issuers that support auto-renewal via ACME
  AUTO_RENEWABLE_ISSUERS: ["Let's Encrypt", 'ZeroSSL'] as string[],
} as const;

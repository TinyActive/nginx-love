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
  validFrom: Date;
  validTo: Date;
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
  MANUAL_ISSUER: 'Manual Upload',
} as const;

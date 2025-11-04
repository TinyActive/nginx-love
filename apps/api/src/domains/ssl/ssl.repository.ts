import prisma from '../../config/database';
import { SSLCertificate, Prisma } from '@prisma/client';
import { SSLCertificateWithDomain } from './ssl.types';

/**
 * Helper functions for SQLite JSON/array serialization and deserialization
 */
const deserializeSans = (sans: string | null): string[] => {
  if (!sans) return [];
  try {
    const parsed = JSON.parse(sans);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const deserializeJsonField = (field: string | null): any => {
  if (!field) return null;
  try {
    return JSON.parse(field);
  } catch {
    return null;
  }
};

/**
 * Transform SSL certificate from database (deserialize JSON fields)
 */
const transformSSLCertificate = (cert: any): any => {
  if (!cert) return cert;
  return {
    ...cert,
    sans: deserializeSans(cert.sans),
    subjectDetails: deserializeJsonField(cert.subjectDetails),
    issuerDetails: deserializeJsonField(cert.issuerDetails),
  };
};

/**
 * Serialize SSL certificate data for database (convert to JSON strings)
 */
export const serializeSSLData = (data: any): any => {
  const serialized: any = { ...data };
  
  if (data.sans !== undefined) {
    serialized.sans = Array.isArray(data.sans) ? JSON.stringify(data.sans) : data.sans;
  }
  
  if (data.subjectDetails !== undefined && data.subjectDetails !== null) {
    serialized.subjectDetails = typeof data.subjectDetails === 'object' 
      ? JSON.stringify(data.subjectDetails) 
      : data.subjectDetails;
  }
  
  if (data.issuerDetails !== undefined && data.issuerDetails !== null) {
    serialized.issuerDetails = typeof data.issuerDetails === 'object'
      ? JSON.stringify(data.issuerDetails)
      : data.issuerDetails;
  }
  
  return serialized;
};

/**
 * SSL Repository - Handles all database operations for SSL certificates
 */
export class SSLRepository {
  /**
   * Find all SSL certificates with domain information
   */
  async findAll(): Promise<SSLCertificateWithDomain[]> {
    const certs = await prisma.sSLCertificate.findMany({
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { validTo: 'asc' },
    });
    return certs.map(transformSSLCertificate);
  }

  /**
   * Find SSL certificate by ID
   */
  async findById(id: string): Promise<SSLCertificateWithDomain | null> {
    const cert = await prisma.sSLCertificate.findUnique({
      where: { id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
    return transformSSLCertificate(cert);
  }

  /**
   * Find SSL certificate by domain ID
   */
  async findByDomainId(domainId: string): Promise<SSLCertificate | null> {
    const cert = await prisma.sSLCertificate.findUnique({
      where: { domainId },
    });
    return transformSSLCertificate(cert);
  }

  /**
   * Create SSL certificate
   */
  async create(
    data: Prisma.SSLCertificateCreateInput
  ): Promise<SSLCertificateWithDomain> {
    const cert = await prisma.sSLCertificate.create({
      data: serializeSSLData(data),
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
    return transformSSLCertificate(cert);
  }

  /**
   * Update SSL certificate
   */
  async update(
    id: string,
    data: Prisma.SSLCertificateUpdateInput
  ): Promise<SSLCertificateWithDomain> {
    const cert = await prisma.sSLCertificate.update({
      where: { id },
      data: serializeSSLData(data),
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
    return transformSSLCertificate(cert);
  }

  /**
   * Delete SSL certificate
   */
  async delete(id: string): Promise<SSLCertificate> {
    return prisma.sSLCertificate.delete({
      where: { id },
    });
  }

  /**
   * Update domain SSL expiry
   */
  async updateDomainSSLExpiry(domainId: string, sslExpiry: Date | null): Promise<void> {
    await prisma.domain.update({
      where: { id: domainId },
      data: { sslExpiry },
    });
  }

  /**
   * Update domain SSL status
   */
  async updateDomainSSLStatus(
    domainId: string,
    sslEnabled: boolean,
    sslExpiry: Date | null
  ): Promise<void> {
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        sslEnabled,
        sslExpiry,
      },
    });
  }
}

// Export singleton instance
export const sslRepository = new SSLRepository();

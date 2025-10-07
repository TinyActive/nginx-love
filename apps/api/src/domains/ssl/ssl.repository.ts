import prisma from '../../config/database';
import { SSLCertificate, Prisma } from '@prisma/client';
import { SSLCertificateWithDomain } from './ssl.types';

/**
 * SSL Repository - Handles all database operations for SSL certificates
 */
export class SSLRepository {
  /**
   * Find all SSL certificates with domain information
   */
  async findAll(): Promise<SSLCertificateWithDomain[]> {
    return prisma.sSLCertificate.findMany({
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
  }

  /**
   * Find SSL certificate by ID
   */
  async findById(id: string): Promise<SSLCertificateWithDomain | null> {
    return prisma.sSLCertificate.findUnique({
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
  }

  /**
   * Find SSL certificate by domain ID
   */
  async findByDomainId(domainId: string): Promise<SSLCertificate | null> {
    return prisma.sSLCertificate.findUnique({
      where: { domainId },
    });
  }

  /**
   * Create SSL certificate
   */
  async create(
    data: Prisma.SSLCertificateCreateInput
  ): Promise<SSLCertificateWithDomain> {
    return prisma.sSLCertificate.create({
      data,
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
  }

  /**
   * Update SSL certificate
   */
  async update(
    id: string,
    data: Prisma.SSLCertificateUpdateInput
  ): Promise<SSLCertificateWithDomain> {
    return prisma.sSLCertificate.update({
      where: { id },
      data,
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

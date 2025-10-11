import prisma from '../../config/database';
import {
  DomainWithRelations,
  DomainQueryOptions,
  CreateDomainInput,
  UpdateDomainInput,
  CreateUpstreamData,
} from './domains.types';
import { PaginationMeta } from '../../shared/types/common.types';

/**
 * Repository for domain database operations
 */
export class DomainsRepository {
  /**
   * Find all domains with pagination and filters
   */
  async findAll(
    options: DomainQueryOptions
  ): Promise<{ domains: DomainWithRelations[]; pagination: PaginationMeta }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = options;

    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (filters.search) {
      where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.sslEnabled !== undefined && filters.sslEnabled !== '') {
      where.sslEnabled = filters.sslEnabled === 'true';
    }

    if (filters.modsecEnabled !== undefined && filters.modsecEnabled !== '') {
      where.modsecEnabled = filters.modsecEnabled === 'true';
    }

    // Get total count
    const totalCount = await prisma.domain.count({ where });

    // Get domains with pagination
    const domains = await prisma.domain.findMany({
      where,
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: {
          select: {
            id: true,
            commonName: true,
            validFrom: true,
            validTo: true,
            status: true,
          },
        },
        modsecRules: {
          where: { enabled: true },
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limitNum,
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limitNum);

    return {
      domains: domains as DomainWithRelations[],
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  }

  /**
   * Find domain by ID
   */
  async findById(id: string): Promise<DomainWithRelations | null> {
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: true,
        modsecRules: true,
      },
    });

    return domain as DomainWithRelations | null;
  }

  /**
   * Find domain by name
   */
  async findByName(name: string): Promise<DomainWithRelations | null> {
    const domain = await prisma.domain.findUnique({
      where: { name },
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: true,
        modsecRules: true,
      },
    });

    return domain as DomainWithRelations | null;
  }

  /**
   * Create new domain
   */
  async create(input: CreateDomainInput): Promise<DomainWithRelations> {
    const domain = await prisma.domain.create({
      data: {
        name: input.name,
        status: 'inactive' as const,
        modsecEnabled: input.modsecEnabled !== undefined ? input.modsecEnabled : true,
        realIpEnabled: input.realIpConfig?.realIpEnabled || false,
        realIpCloudflare: input.realIpConfig?.realIpCloudflare || false,
        realIpCustomCidrs: input.realIpConfig?.realIpCustomCidrs || [],
        upstreams: {
          create: input.upstreams.map((u: CreateUpstreamData) => ({
            host: u.host,
            port: u.port,
            protocol: u.protocol || 'http',
            sslVerify: u.sslVerify !== undefined ? u.sslVerify : true,
            weight: u.weight || 1,
            maxFails: u.maxFails || 3,
            failTimeout: u.failTimeout || 10,
            status: 'checking',
          })),
        },
        loadBalancer: {
          create: {
            algorithm: (input.loadBalancer?.algorithm || 'round_robin') as any,
            healthCheckEnabled:
              input.loadBalancer?.healthCheckEnabled !== undefined
                ? input.loadBalancer.healthCheckEnabled
                : true,
            healthCheckInterval: input.loadBalancer?.healthCheckInterval || 30,
            healthCheckTimeout: input.loadBalancer?.healthCheckTimeout || 5,
            healthCheckPath: input.loadBalancer?.healthCheckPath || '/',
          },
        },
      },
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: true,
      },
    });

    return domain as DomainWithRelations;
  }

  /**
   * Update domain status
   */
  async updateStatus(id: string, status: string): Promise<DomainWithRelations> {
    const domain = await prisma.domain.update({
      where: { id },
      data: { status: status as any },
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: true,
      },
    });

    return domain as DomainWithRelations;
  }

  /**
   * Update domain
   */
  async update(id: string, input: UpdateDomainInput): Promise<DomainWithRelations> {
    // Get current domain
    const currentDomain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!currentDomain) {
      throw new Error('Domain not found');
    }

    // Update domain basic fields
    await prisma.domain.update({
      where: { id },
      data: {
        name: input.name || currentDomain.name,
        status: (input.status || currentDomain.status) as any,
        modsecEnabled:
          input.modsecEnabled !== undefined
            ? input.modsecEnabled
            : currentDomain.modsecEnabled,
        realIpEnabled:
          input.realIpConfig?.realIpEnabled !== undefined
            ? input.realIpConfig.realIpEnabled
            : currentDomain.realIpEnabled,
        realIpCloudflare:
          input.realIpConfig?.realIpCloudflare !== undefined
            ? input.realIpConfig.realIpCloudflare
            : currentDomain.realIpCloudflare,
        realIpCustomCidrs:
          input.realIpConfig?.realIpCustomCidrs !== undefined
            ? input.realIpConfig.realIpCustomCidrs
            : currentDomain.realIpCustomCidrs,
      },
    });

    // Update upstreams if provided
    if (input.upstreams && Array.isArray(input.upstreams)) {
      // Delete existing upstreams
      await prisma.upstream.deleteMany({
        where: { domainId: id },
      });

      // Create new upstreams
      await prisma.upstream.createMany({
        data: input.upstreams.map((u: CreateUpstreamData) => ({
          domainId: id,
          host: u.host,
          port: u.port,
          protocol: u.protocol || 'http',
          sslVerify: u.sslVerify !== undefined ? u.sslVerify : true,
          weight: u.weight || 1,
          maxFails: u.maxFails || 3,
          failTimeout: u.failTimeout || 10,
          status: 'checking',
        })),
      });
    }

    // Update load balancer if provided
    if (input.loadBalancer) {
      await prisma.loadBalancerConfig.upsert({
        where: { domainId: id },
        create: {
          domainId: id,
          algorithm: (input.loadBalancer.algorithm || 'round_robin') as any,
          healthCheckEnabled:
            input.loadBalancer.healthCheckEnabled !== undefined
              ? input.loadBalancer.healthCheckEnabled
              : true,
          healthCheckInterval: input.loadBalancer.healthCheckInterval || 30,
          healthCheckTimeout: input.loadBalancer.healthCheckTimeout || 5,
          healthCheckPath: input.loadBalancer.healthCheckPath || '/',
        },
        update: {
          algorithm: input.loadBalancer.algorithm as any,
          healthCheckEnabled: input.loadBalancer.healthCheckEnabled,
          healthCheckInterval: input.loadBalancer.healthCheckInterval,
          healthCheckTimeout: input.loadBalancer.healthCheckTimeout,
          healthCheckPath: input.loadBalancer.healthCheckPath,
        },
      });
    }

    // Return updated domain
    return this.findById(id) as Promise<DomainWithRelations>;
  }

  /**
   * Update SSL settings
   */
  async updateSSL(
    id: string,
    sslEnabled: boolean
  ): Promise<DomainWithRelations> {
    const domain = await this.findById(id);

    if (!domain) {
      throw new Error('Domain not found');
    }

    const updatedDomain = await prisma.domain.update({
      where: { id },
      data: {
        sslEnabled,
        sslExpiry:
          sslEnabled && domain.sslCertificate
            ? domain.sslCertificate.validTo
            : null,
      },
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: true,
      },
    });

    return updatedDomain as DomainWithRelations;
  }

  /**
   * Delete domain
   */
  async delete(id: string): Promise<void> {
    await prisma.domain.delete({
      where: { id },
    });
  }
}

// Export singleton instance
export const domainsRepository = new DomainsRepository();
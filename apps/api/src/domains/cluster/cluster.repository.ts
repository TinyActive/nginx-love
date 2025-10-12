import prisma from '../../config/database';
import { SlaveNode, SlaveNodeResponse, SyncConfigData } from './cluster.types';

/**
 * Cluster Repository - Database operations for slave nodes
 */
export class ClusterRepository {
  /**
   * Find slave node by name
   */
  async findByName(name: string): Promise<SlaveNode | null> {
    return prisma.slaveNode.findUnique({
      where: { name }
    });
  }

  /**
   * Find slave node by ID
   */
  async findById(id: string): Promise<SlaveNodeResponse | null> {
    return prisma.slaveNode.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        status: true,
        syncEnabled: true,
        syncInterval: true,
        lastSeen: true,
        configHash: true,
        createdAt: true,
        updatedAt: true
        // DO NOT return apiKey
      }
    });
  }

  /**
   * Find slave node by API key
   */
  async findByApiKey(apiKey: string): Promise<Pick<SlaveNode, 'id' | 'name' | 'host' | 'port' | 'syncEnabled'> | null> {
    return prisma.slaveNode.findFirst({
      where: { apiKey },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        syncEnabled: true
      }
    });
  }

  /**
   * Create new slave node
   */
  async create(data: {
    name: string;
    host: string;
    port: number;
    syncInterval: number;
    apiKey: string;
    syncEnabled: boolean;
    status: string;
  }): Promise<SlaveNode> {
    return prisma.slaveNode.create({
      data: {
        ...data,
        status: data.status as any
      }
    });
  }

  /**
   * Get all slave nodes (without API keys)
   */
  async findAll(): Promise<SlaveNodeResponse[]> {
    return prisma.slaveNode.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        status: true,
        syncEnabled: true,
        syncInterval: true,
        lastSeen: true,
        configHash: true,
        createdAt: true,
        updatedAt: true
        // DO NOT return apiKey
      }
    });
  }

  /**
   * Delete slave node
   */
  async delete(id: string): Promise<void> {
    await prisma.slaveNode.delete({
      where: { id }
    });
  }

  /**
   * Update slave node last seen timestamp
   */
  async updateLastSeen(id: string, lastSeen: Date = new Date()): Promise<void> {
    await prisma.slaveNode.update({
      where: { id },
      data: { lastSeen }
    }).catch(() => {}); // Don't fail if update fails
  }

  /**
   * Update slave node last seen timestamp and status
   */
  async updateLastSeenAndStatus(
    id: string,
    lastSeen: Date = new Date(),
    status: 'online' | 'offline' = 'online'
  ): Promise<void> {
    await prisma.slaveNode.update({
      where: { id },
      data: { lastSeen, status }
    }).catch(() => {}); // Don't fail if update fails
  }

  /**
   * Update slave node config hash
   */
  async updateConfigHash(id: string, configHash: string): Promise<void> {
    await prisma.slaveNode.update({
      where: { id },
      data: { configHash }
    }).catch(() => {}); // Don't fail if update fails
  }

  /**
   * Find stale nodes (not seen in X minutes)
   */
  async findStaleNodes(minutesAgo: number = 5): Promise<Array<{ id: string; name: string; lastSeen: Date | null }>> {
    const thresholdTime = new Date(Date.now() - minutesAgo * 60 * 1000);

    return prisma.slaveNode.findMany({
      where: {
        status: 'online',
        lastSeen: {
          lt: thresholdTime
        }
      },
      select: {
        id: true,
        name: true,
        lastSeen: true
      }
    });
  }

  /**
   * Mark nodes as offline
   */
  async markNodesOffline(nodeIds: string[]): Promise<void> {
    await prisma.slaveNode.updateMany({
      where: {
        id: {
          in: nodeIds
        }
      },
      data: {
        status: 'offline'
      }
    });
  }

  /**
   * Collect sync configuration data
   */
  async collectSyncData(): Promise<SyncConfigData> {
    const domains = await prisma.domain.findMany({
      include: {
        upstreams: true,
        loadBalancer: true
      }
    });

    const ssl = await prisma.sSLCertificate.findMany({
      include: {
        domain: true
      }
    });

    const modsecCRS = await prisma.modSecCRSRule.findMany();
    const modsecCustom = await prisma.modSecRule.findMany();
    const acl = await prisma.aclRule.findMany();
    const users = await prisma.user.findMany();

    // Get Network Load Balancers
    const networkLoadBalancers = await this.getAllNetworkLoadBalancersForSync();

    return {
      // Domains (NO timestamps, NO IDs)
      domains: domains.map(d => ({
        name: d.name,
        status: d.status,
        sslEnabled: d.sslEnabled,
        modsecEnabled: d.modsecEnabled,
        upstreams: d.upstreams.map(u => ({
          host: u.host,
          port: u.port,
          protocol: u.protocol,
          sslVerify: u.sslVerify,
          weight: u.weight,
          maxFails: u.maxFails,
          failTimeout: u.failTimeout
        })),
        loadBalancer: d.loadBalancer ? {
          algorithm: d.loadBalancer.algorithm,
          healthCheckEnabled: d.loadBalancer.healthCheckEnabled,
          healthCheckPath: d.loadBalancer.healthCheckPath,
          healthCheckInterval: d.loadBalancer.healthCheckInterval,
          healthCheckTimeout: d.loadBalancer.healthCheckTimeout
        } : null
      })),

      // SSL Certificates (NO timestamps, NO IDs)
      sslCertificates: ssl.map(s => ({
        domainName: s.domain?.name,
        commonName: s.commonName,
        sans: s.sans,
        issuer: s.issuer,
        certificate: s.certificate,
        privateKey: s.privateKey,
        chain: s.chain,
        autoRenew: s.autoRenew,
        validFrom: s.validFrom.toISOString(),
        validTo: s.validTo.toISOString()
      })),

      // ModSecurity CRS Rules (NO timestamps, NO IDs)
      modsecCRSRules: modsecCRS.map(r => ({
        ruleFile: r.ruleFile,
        name: r.name,
        category: r.category,
        description: r.description || '',
        enabled: r.enabled,
        paranoia: r.paranoia
      })),

      // ModSecurity Custom Rules (NO timestamps, NO IDs)
      modsecCustomRules: modsecCustom.map(r => ({
        name: r.name,
        category: r.category,
        ruleContent: r.ruleContent,
        description: r.description,
        enabled: r.enabled
      })),

      // ACL (NO timestamps, NO IDs)
      aclRules: acl.map(a => ({
        name: a.name,
        type: a.type,
        conditionField: a.conditionField,
        conditionOperator: a.conditionOperator,
        conditionValue: a.conditionValue,
        action: a.action,
        enabled: a.enabled
      })),

      // Users (NO timestamps, NO IDs, keep password hashes)
      users: users.map(u => ({
        email: u.email,
        username: u.username,
        fullName: u.fullName,
        password: u.password, // Already hashed
        role: u.role
      })),

      // Network Load Balancers (NO timestamps, NO IDs)
      networkLoadBalancers: networkLoadBalancers.map(nlb => ({
        name: nlb.name,
        description: nlb.description || undefined,
        port: nlb.port,
        protocol: nlb.protocol,
        algorithm: nlb.algorithm,
        enabled: nlb.enabled,
        proxyTimeout: nlb.proxyTimeout,
        proxyConnectTimeout: nlb.proxyConnectTimeout,
        proxyNextUpstream: nlb.proxyNextUpstream,
        proxyNextUpstreamTimeout: nlb.proxyNextUpstreamTimeout,
        proxyNextUpstreamTries: nlb.proxyNextUpstreamTries,
        healthCheckEnabled: nlb.healthCheckEnabled,
        healthCheckInterval: nlb.healthCheckInterval,
        healthCheckTimeout: nlb.healthCheckTimeout,
        healthCheckRises: nlb.healthCheckRises,
        healthCheckFalls: nlb.healthCheckFalls,
        upstreams: nlb.upstreams.map(u => ({
          host: u.host,
          port: u.port,
          weight: u.weight,
          maxFails: u.maxFails,
          failTimeout: u.failTimeout,
          maxConns: u.maxConns,
          backup: u.backup,
          down: u.down,
        })),
      }))
    };
  }

  /**
   * Import sync configuration (upsert operations)
   */
  async importSyncConfig(config: SyncConfigData) {
    const results = {
      domains: 0,
      upstreams: 0,
      loadBalancers: 0,
      ssl: 0,
      modsecCRS: 0,
      modsecCustom: 0,
      acl: 0,
      users: 0,
      networkLoadBalancers: 0,
      nlbUpstreams: 0,
      totalChanges: 0
    };

    // 1. Import Domains + Upstreams + Load Balancers
    if (config.domains && Array.isArray(config.domains)) {
      for (const domainData of config.domains) {
        const domain = await prisma.domain.upsert({
          where: { name: domainData.name },
          update: {
            status: domainData.status as any,
            sslEnabled: domainData.sslEnabled,
            modsecEnabled: domainData.modsecEnabled
          },
          create: {
            name: domainData.name,
            status: domainData.status as any,
            sslEnabled: domainData.sslEnabled,
            modsecEnabled: domainData.modsecEnabled
          }
        });
        results.domains++;

        // Import upstreams
        if (domainData.upstreams && Array.isArray(domainData.upstreams)) {
          await prisma.upstream.deleteMany({ where: { domainId: domain.id } });

          for (const upstream of domainData.upstreams) {
            await prisma.upstream.create({
              data: {
                domainId: domain.id,
                host: upstream.host,
                port: upstream.port,
                protocol: upstream.protocol || 'http',
                sslVerify: upstream.sslVerify !== false,
                weight: upstream.weight || 1,
                maxFails: upstream.maxFails || 3,
                failTimeout: upstream.failTimeout || 10
              }
            });
            results.upstreams++;
          }
        }

        // Import load balancer
        if (domainData.loadBalancer) {
          await prisma.loadBalancerConfig.upsert({
            where: { domainId: domain.id },
            update: {
              algorithm: domainData.loadBalancer.algorithm as any,
              healthCheckEnabled: domainData.loadBalancer.healthCheckEnabled,
              healthCheckPath: domainData.loadBalancer.healthCheckPath || undefined,
              healthCheckInterval: domainData.loadBalancer.healthCheckInterval,
              healthCheckTimeout: domainData.loadBalancer.healthCheckTimeout
            },
            create: {
              domainId: domain.id,
              algorithm: domainData.loadBalancer.algorithm as any,
              healthCheckEnabled: domainData.loadBalancer.healthCheckEnabled,
              healthCheckPath: domainData.loadBalancer.healthCheckPath || undefined,
              healthCheckInterval: domainData.loadBalancer.healthCheckInterval,
              healthCheckTimeout: domainData.loadBalancer.healthCheckTimeout
            }
          });
          results.loadBalancers++;
        }
      }
    }

    // 2. Import SSL Certificates
    if (config.sslCertificates && Array.isArray(config.sslCertificates)) {
      for (const sslData of config.sslCertificates) {
        const domain = await prisma.domain.findUnique({
          where: { name: sslData.domainName || '' }
        });

        if (!domain) continue;

        await prisma.sSLCertificate.upsert({
          where: { domainId: domain.id },
          update: {
            commonName: sslData.commonName,
            sans: sslData.sans || [],
            issuer: sslData.issuer,
            certificate: sslData.certificate,
            privateKey: sslData.privateKey,
            chain: sslData.chain,
            validFrom: sslData.validFrom ? new Date(sslData.validFrom) : new Date(),
            validTo: sslData.validTo ? new Date(sslData.validTo) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            autoRenew: sslData.autoRenew || false
          },
          create: {
            domainId: domain.id,
            commonName: sslData.commonName,
            sans: sslData.sans || [],
            issuer: sslData.issuer,
            certificate: sslData.certificate,
            privateKey: sslData.privateKey,
            chain: sslData.chain,
            validFrom: sslData.validFrom ? new Date(sslData.validFrom) : new Date(),
            validTo: sslData.validTo ? new Date(sslData.validTo) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            autoRenew: sslData.autoRenew || false
          }
        });
        results.ssl++;
      }
    }

    // 3. Import ModSecurity CRS Rules
    if (config.modsecCRSRules && Array.isArray(config.modsecCRSRules)) {
      await prisma.modSecCRSRule.deleteMany({});

      for (const rule of config.modsecCRSRules) {
        await prisma.modSecCRSRule.create({
          data: {
            ruleFile: rule.ruleFile,
            name: rule.name,
            category: rule.category,
            description: rule.description || '',
            enabled: rule.enabled,
            paranoia: rule.paranoia || 1
          }
        });
        results.modsecCRS++;
      }
    }

    // 4. Import ModSecurity Custom Rules
    if (config.modsecCustomRules && Array.isArray(config.modsecCustomRules)) {
      await prisma.modSecRule.deleteMany({});

      for (const rule of config.modsecCustomRules) {
        await prisma.modSecRule.create({
          data: {
            name: rule.name,
            category: rule.category,
            ruleContent: rule.ruleContent,
            enabled: rule.enabled,
            description: rule.description
          }
        });
        results.modsecCustom++;
      }
    }

    // 5. Import ACL Rules
    if (config.aclRules && Array.isArray(config.aclRules)) {
      await prisma.aclRule.deleteMany({});

      for (const rule of config.aclRules) {
        await prisma.aclRule.create({
          data: {
            name: rule.name,
            type: rule.type as any,
            conditionField: rule.conditionField as any,
            conditionOperator: rule.conditionOperator as any,
            conditionValue: rule.conditionValue,
            action: rule.action as any,
            enabled: rule.enabled
          }
        });
        results.acl++;
      }
    }

    // 6. Import Users
    if (config.users && Array.isArray(config.users)) {
      for (const userData of config.users) {
        await prisma.user.upsert({
          where: { email: userData.email },
          update: {
            username: userData.username,
            fullName: userData.fullName,
            role: userData.role as any
            // Don't update password for security
          },
          create: {
            email: userData.email,
            username: userData.username,
            fullName: userData.fullName,
            password: userData.password, // Already hashed
            role: userData.role as any
          }
        });
        results.users++;
      }
    }

    // 7. Import Network Load Balancers
    if (config.networkLoadBalancers && Array.isArray(config.networkLoadBalancers)) {
      for (const nlbData of config.networkLoadBalancers) {
        const nlb = await this.upsertNetworkLoadBalancerForSync(nlbData.name, {
          description: nlbData.description,
          port: nlbData.port,
          protocol: nlbData.protocol as any,
          algorithm: nlbData.algorithm as any,
          enabled: nlbData.enabled,
          proxyTimeout: nlbData.proxyTimeout,
          proxyConnectTimeout: nlbData.proxyConnectTimeout,
          proxyNextUpstream: nlbData.proxyNextUpstream,
          proxyNextUpstreamTimeout: nlbData.proxyNextUpstreamTimeout,
          proxyNextUpstreamTries: nlbData.proxyNextUpstreamTries,
          healthCheckEnabled: nlbData.healthCheckEnabled,
          healthCheckInterval: nlbData.healthCheckInterval,
          healthCheckTimeout: nlbData.healthCheckTimeout,
          healthCheckRises: nlbData.healthCheckRises,
          healthCheckFalls: nlbData.healthCheckFalls,
        });
        results.networkLoadBalancers++;

        // Import upstreams
        if (nlbData.upstreams && Array.isArray(nlbData.upstreams)) {
          await this.deleteNLBUpstreamsByNLBIdForSync(nlb.id);

          for (const upstream of nlbData.upstreams) {
            await this.createNLBUpstreamForSync({
              nlbId: nlb.id,
              host: upstream.host,
              port: upstream.port,
              weight: upstream.weight,
              maxFails: upstream.maxFails,
              failTimeout: upstream.failTimeout,
              maxConns: upstream.maxConns,
              backup: upstream.backup,
              down: upstream.down,
            });
            results.nlbUpstreams++;
          }
        }
      }
    }

    results.totalChanges = results.domains + results.ssl + results.modsecCRS +
                           results.modsecCustom + results.acl + results.users +
                           results.networkLoadBalancers;

    return results;
  }

  /**
   * Get all Network Load Balancers for sync
   */
  async getAllNetworkLoadBalancersForSync() {
    return prisma.networkLoadBalancer.findMany({
      include: {
        upstreams: true,
      },
    });
  }

  /**
   * Upsert Network Load Balancer for sync
   */
  async upsertNetworkLoadBalancerForSync(name: string, data: any) {
    return prisma.networkLoadBalancer.upsert({
      where: { name },
      update: data,
      create: { name, ...data },
    });
  }

  /**
   * Create NLB upstream for sync
   */
  async createNLBUpstreamForSync(data: any) {
    return prisma.nLBUpstream.create({
      data,
    });
  }

  /**
   * Delete NLB upstreams by NLB ID for sync
   */
  async deleteNLBUpstreamsByNLBIdForSync(nlbId: string) {
    return prisma.nLBUpstream.deleteMany({
      where: { nlbId },
    });
  }

  /**
   * Update system config last connected timestamp
   */
  async updateSystemConfigLastConnected(): Promise<void> {
    const systemConfig = await prisma.systemConfig.findFirst();
    if (systemConfig) {
      await prisma.systemConfig.update({
        where: { id: systemConfig.id },
        data: {
          lastConnectedAt: new Date()
        }
      });
    }
  }
}

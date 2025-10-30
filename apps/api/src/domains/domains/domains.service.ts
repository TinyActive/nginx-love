import logger from '../../utils/logger';
import prisma from '../../config/database';
import { domainsRepository } from './domains.repository';
import { nginxConfigService } from './services/nginx-config.service';
import { nginxReloadService } from './services/nginx-reload.service';
import {
  DomainWithRelations,
  DomainQueryOptions,
  CreateDomainInput,
  UpdateDomainInput,
  NginxReloadResult,
} from './domains.types';
import { PaginationMeta } from '../../shared/types/common.types';

/**
 * Main service orchestrator for domain operations
 */
export class DomainsService {
  /**
   * Get all domains with pagination and filters
   */
  async getDomains(
    options: DomainQueryOptions
  ): Promise<{ domains: DomainWithRelations[]; pagination: PaginationMeta }> {
    return domainsRepository.findAll(options);
  }

  /**
   * Get domain by ID
   */
  async getDomainById(id: string): Promise<DomainWithRelations | null> {
    return domainsRepository.findById(id);
  }

  /**
   * Create new domain
   */
  async createDomain(
    input: CreateDomainInput,
    userId: string,
    username: string,
    ip: string,
    userAgent: string
  ): Promise<DomainWithRelations> {
    // Check if domain already exists
    const existingDomain = await domainsRepository.findByName(input.name);
    if (existingDomain) {
      throw new Error('Domain already exists');
    }

    // Create domain
    const domain = await domainsRepository.create(input);

    try {
      // Generate nginx configuration (includes validation)
      await nginxConfigService.generateConfig(domain);

      // Update domain status to active
      const updatedDomain = await domainsRepository.updateStatus(domain.id, 'active');

      // Enable configuration
      await nginxConfigService.enableConfig(domain.name);

      // Auto-reload nginx
      const reloadResult = await nginxReloadService.reload();
      if (!reloadResult.success) {
        // Rollback: delete domain and config
        await nginxConfigService.deleteConfig(domain.name);
        await domainsRepository.delete(domain.id);
        throw new Error(`Nginx reload failed: ${reloadResult.error || 'Unknown error'}`);
      }

      // Log activity
      await this.logActivity(
        userId,
        `Created domain: ${input.name}`,
        'config_change',
        ip,
        userAgent,
        true
      );

      logger.info(`Domain ${input.name} created by user ${username}`);

      return updatedDomain;
    } catch (error: any) {
      // Rollback: delete domain from database
      logger.error(`Failed to create domain ${input.name}, rolling back:`, error);
      try {
        await nginxConfigService.deleteConfig(domain.name);
        await domainsRepository.delete(domain.id);
        logger.info(`Rolled back domain creation for ${input.name}`);
      } catch (rollbackError) {
        logger.error(`Failed to rollback domain creation:`, rollbackError);
      }
      
      // Re-throw with user-friendly message
      if (error.message.includes('Invalid nginx configuration')) {
        throw new Error(`Nginx configuration validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Regenerate nginx configuration for a domain
   * Used when domain-related configurations change (e.g., access lists)
   */
  async regenerateConfig(domainId: string): Promise<void> {
    // Get domain with all relations including access lists
    const domain = await domainsRepository.findById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    // Regenerate nginx config
    await nginxConfigService.generateConfig(domain);

    // Auto-reload nginx
    await nginxReloadService.autoReload(true);

    logger.info(`Regenerated nginx config for domain ${domain.name}`);
  }

  /**
   * Update domain
   */
  async updateDomain(
    id: string,
    input: UpdateDomainInput,
    userId: string,
    username: string,
    ip: string,
    userAgent: string
  ): Promise<DomainWithRelations> {
    // Check if domain exists
    const originalDomain = await domainsRepository.findById(id);
    if (!originalDomain) {
      throw new Error('Domain not found');
    }

    // Store original data for rollback
    const originalData: UpdateDomainInput = {
      name: originalDomain.name,
      status: originalDomain.status,
      modsecEnabled: originalDomain.modsecEnabled,
      upstreams: originalDomain.upstreams.map(u => ({
        host: u.host,
        port: u.port,
        protocol: u.protocol,
        sslVerify: u.sslVerify,
        weight: u.weight,
        maxFails: u.maxFails,
        failTimeout: u.failTimeout,
      })),
      loadBalancer: originalDomain.loadBalancer ? {
        algorithm: originalDomain.loadBalancer.algorithm,
        healthCheckEnabled: originalDomain.loadBalancer.healthCheckEnabled,
        healthCheckInterval: originalDomain.loadBalancer.healthCheckInterval,
        healthCheckTimeout: originalDomain.loadBalancer.healthCheckTimeout,
        healthCheckPath: originalDomain.loadBalancer.healthCheckPath,
      } : undefined,
    };

    try {
      // Update domain
      await domainsRepository.update(id, input);

      // Get updated domain with relations
      const updatedDomain = await domainsRepository.findById(id);
      if (!updatedDomain) {
        throw new Error('Failed to fetch updated domain');
      }

      // Regenerate nginx config (includes validation and backup)
      await nginxConfigService.generateConfig(updatedDomain);

      // Auto-reload nginx
      const reloadResult = await nginxReloadService.reload();
      if (!reloadResult.success) {
        // Rollback: restore original domain data
        await domainsRepository.update(id, originalData);
        const restoredDomain = await domainsRepository.findById(id);
        if (restoredDomain) {
          await nginxConfigService.generateConfig(restoredDomain);
        }
        throw new Error(`Nginx reload failed: ${reloadResult.error || 'Unknown error'}`);
      }

      // Log activity
      await this.logActivity(
        userId,
        `Updated domain: ${updatedDomain.name}`,
        'config_change',
        ip,
        userAgent,
        true
      );

      logger.info(`Domain ${updatedDomain.name} updated by user ${username}`);

      return updatedDomain;
    } catch (error: any) {
      // Rollback: restore original domain data
      logger.error(`Failed to update domain ${originalDomain.name}, rolling back:`, error);
      try {
        await domainsRepository.update(id, originalData);
        const restoredDomain = await domainsRepository.findById(id);
        if (restoredDomain) {
          await nginxConfigService.generateConfig(restoredDomain);
        }
        logger.info(`Rolled back domain update for ${originalDomain.name}`);
      } catch (rollbackError) {
        logger.error(`Failed to rollback domain update:`, rollbackError);
      }
      
      // Re-throw with user-friendly message
      if (error.message.includes('Invalid nginx configuration')) {
        throw new Error(`Nginx configuration validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Delete domain
   */
  async deleteDomain(
    id: string,
    userId: string,
    username: string,
    ip: string,
    userAgent: string
  ): Promise<void> {
    // Check if domain exists
    const domain = await domainsRepository.findById(id);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const domainName = domain.name;

    // Delete nginx configuration
    await nginxConfigService.deleteConfig(domainName);

    // Delete domain from database
    await domainsRepository.delete(id);

    // Auto-reload nginx
    await nginxReloadService.autoReload(true);

    // Log activity
    await this.logActivity(
      userId,
      `Deleted domain: ${domainName}`,
      'config_change',
      ip,
      userAgent,
      true
    );

    logger.info(`Domain ${domainName} deleted by user ${username}`);
  }

  /**
   * Toggle SSL for domain
   */
  async toggleSSL(
    id: string,
    sslEnabled: boolean,
    userId: string,
    username: string,
    ip: string,
    userAgent: string
  ): Promise<DomainWithRelations> {
    // Get domain
    const domain = await domainsRepository.findById(id);
    if (!domain) {
      throw new Error('Domain not found');
    }

    // If enabling SSL, check if certificate exists
    if (sslEnabled && !domain.sslCertificate) {
      throw new Error(
        'Cannot enable SSL: No SSL certificate found for this domain. Please issue or upload a certificate first.'
      );
    }

    // Update SSL status
    const updatedDomain = await domainsRepository.updateSSL(id, sslEnabled);

    logger.info(`Fetched domain for nginx config: ${updatedDomain.name}`);
    logger.info(`- sslEnabled: ${updatedDomain.sslEnabled}`);
    logger.info(`- sslCertificate exists: ${!!updatedDomain.sslCertificate}`);
    if (updatedDomain.sslCertificate) {
      logger.info(`- Certificate ID: ${updatedDomain.sslCertificate.id}`);
      logger.info(
        `- Certificate commonName: ${updatedDomain.sslCertificate.commonName}`
      );
    }

    // Regenerate nginx config with SSL settings
    await nginxConfigService.generateConfig(updatedDomain);

    // Auto-reload nginx
    await nginxReloadService.autoReload(true);

    // Log activity
    await this.logActivity(
      userId,
      `${sslEnabled ? 'Enabled' : 'Disabled'} SSL for domain: ${domain.name}`,
      'config_change',
      ip,
      userAgent,
      true
    );

    logger.info(
      `SSL ${sslEnabled ? 'enabled' : 'disabled'} for ${domain.name} by user ${username}`
    );

    return updatedDomain;
  }

  /**
   * Reload nginx configuration
   */
  async reloadNginx(
    userId: string,
    username: string,
    ip: string,
    userAgent: string
  ): Promise<NginxReloadResult> {
    const result = await nginxReloadService.reload();

    if (result.success) {
      // Log activity
      await this.logActivity(
        userId,
        `Nginx ${result.method} successful (${result.mode} mode)`,
        'config_change',
        ip,
        userAgent,
        true
      );

      logger.info(
        `Nginx ${result.method} by user ${username} (${result.mode} mode)`
      );
    }

    return result;
  }

  /**
   * Log activity
   */
  private async logActivity(
    userId: string,
    action: string,
    type: string,
    ip: string,
    userAgent: string,
    success: boolean
  ): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          type: type as any, // ActivityType enum
          ip,
          userAgent,
          success,
        },
      });
    } catch (error) {
      logger.error('Failed to log activity:', error);
    }
  }
}

// Export singleton instance
export const domainsService = new DomainsService();

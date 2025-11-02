import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../utils/logger';
import { backupRepository } from './backup.repository';
import {
  BACKUP_CONSTANTS,
  BackupData,
  BackupMetadata,
  FormattedBackupSchedule,
  FormattedBackupFile,
  ImportResults,
  SSLCertificateFiles,
} from './backup.types';
import { CreateBackupScheduleDto, UpdateBackupScheduleDto } from './dto';
import { backupSchedulerService } from './services/backup-scheduler.service';

const execAsync = promisify(exec);

/**
 * Backup Service - Contains business logic for backup operations
 */
export class BackupService {
  /**
   * Ensure backup directory exists
   */
  async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(BACKUP_CONSTANTS.BACKUP_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
      throw new Error('Failed to create backup directory');
    }
  }

  /**
   * Reload nginx configuration
   */
  async reloadNginx(): Promise<boolean> {
    try {
      logger.info('Testing nginx configuration...');
      await execAsync('nginx -t');

      logger.info('Reloading nginx...');
      await execAsync('nginx -s reload');

      logger.info('Nginx reloaded successfully');
      return true;
    } catch (error: any) {
      logger.error('Failed to reload nginx:', error);
      logger.error('Nginx test/reload output:', error.stdout || error.stderr);

      try {
        logger.info('Trying alternative reload method...');
        await execAsync('nginx -s reload');
        logger.info('Nginx reloaded successfully (alternative method)');
        return true;
      } catch (altError) {
        logger.error('Alternative reload also failed:', altError);
        return false;
      }
    }
  }

  /**
   * Format bytes to human readable size
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get all backup schedules with formatted data
   */
  async getBackupSchedules(): Promise<FormattedBackupSchedule[]> {
    const schedules = await backupRepository.findAllSchedules();

    return schedules.map((schedule) => ({
      id: schedule.id,
      name: schedule.name,
      schedule: schedule.schedule,
      enabled: schedule.enabled,
      lastRun: schedule.lastRun?.toISOString(),
      nextRun: schedule.nextRun?.toISOString(),
      status: schedule.status,
      size: schedule.backups[0]
        ? this.formatBytes(Number(schedule.backups[0].size))
        : undefined,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    }));
  }

  /**
   * Get single backup schedule by ID
   */
  async getBackupSchedule(id: string) {
    const schedule = await backupRepository.findScheduleById(id);
    if (!schedule) {
      throw new Error('Backup schedule not found');
    }
    return schedule;
  }

  /**
   * Create backup schedule
   */
  async createBackupSchedule(dto: CreateBackupScheduleDto, userId?: string) {
    // Calculate nextRun from cron expression
    let nextRun: Date | undefined;
    try {
      nextRun = backupSchedulerService.calculateNextRun(dto.schedule);
    } catch (error) {
      logger.warn('Failed to calculate nextRun for new schedule:', error);
    }

    const newSchedule = await backupRepository.createSchedule({
      name: dto.name,
      schedule: dto.schedule,
      enabled: dto.enabled ?? true,
      nextRun,
    });

    logger.info(`Backup schedule created: ${dto.name}`, {
      userId,
      scheduleId: newSchedule.id,
      nextRun: nextRun?.toISOString(),
    });

    return newSchedule;
  }

  /**
   * Update backup schedule
   */
  async updateBackupSchedule(
    id: string,
    dto: UpdateBackupScheduleDto,
    userId?: string
  ) {
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.schedule) updateData.schedule = dto.schedule;
    if (dto.enabled !== undefined) updateData.enabled = dto.enabled;

    // Recalculate nextRun if cron expression changed
    if (dto.schedule) {
      try {
        updateData.nextRun = backupSchedulerService.calculateNextRun(dto.schedule);
      } catch (error) {
        logger.warn('Failed to calculate nextRun for updated schedule:', error);
      }
    }

    const updatedSchedule = await backupRepository.updateSchedule(id, updateData);

    logger.info(`Backup schedule updated: ${id}`, { userId });

    return updatedSchedule;
  }

  /**
   * Delete backup schedule
   */
  async deleteBackupSchedule(id: string, userId?: string) {
    await backupRepository.deleteSchedule(id);
    logger.info(`Backup schedule deleted: ${id}`, { userId });
  }

  /**
   * Toggle backup schedule enabled status
   */
  async toggleBackupSchedule(id: string, userId?: string) {
    const schedule = await backupRepository.findScheduleById(id);
    if (!schedule) {
      throw new Error('Backup schedule not found');
    }

    const updateData: any = {
      enabled: !schedule.enabled,
    };

    // If enabling, calculate nextRun
    if (!schedule.enabled) {
      try {
        updateData.nextRun = backupSchedulerService.calculateNextRun(schedule.schedule);
      } catch (error) {
        logger.warn('Failed to calculate nextRun when enabling schedule:', error);
      }
    }

    const updated = await backupRepository.updateSchedule(id, updateData);

    logger.info(`Backup schedule toggled: ${id} (enabled: ${updated.enabled})`, {
      userId,
    });

    return updated;
  }

  /**
   * Run backup now (manual backup)
   */
  async runBackupNow(id: string, userId?: string) {
    await this.ensureBackupDir();

    // Update schedule status to running
    await backupRepository.updateSchedule(id, {
      status: 'running',
      lastRun: new Date(),
    });

    try {
      // Collect backup data
      const backupData = await this.collectBackupData();

      // Generate filename
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const filename = `backup-${timestamp}.json`;
      const filepath = path.join(BACKUP_CONSTANTS.BACKUP_DIR, filename);

      // Write backup file
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2), 'utf-8');

      // Get file size
      const stats = await fs.stat(filepath);

      // Create backup file record
      await backupRepository.createBackupFile({
        schedule: { connect: { id } },
        filename,
        filepath,
        size: BigInt(stats.size),
        status: 'success',
        type: 'manual',
        metadata: {
          domainsCount: backupData.domains.length,
          sslCount: backupData.ssl.length,
          modsecRulesCount: backupData.modsec.customRules.length,
          aclRulesCount: backupData.acl.length,
        },
      });

      // Update schedule status
      await backupRepository.updateSchedule(id, {
        status: 'success',
      });

      logger.info(`Manual backup completed: ${filename}`, {
        userId,
        size: stats.size,
      });

      return {
        filename,
        size: this.formatBytes(stats.size),
      };
    } catch (error) {
      logger.error('Run backup error:', error);
      await backupRepository.updateSchedule(id, { status: 'failed' });
      throw error;
    }
  }

  /**
   * Export configuration
   */
  async exportConfig(userId?: string) {
    await this.ensureBackupDir();

    // Collect backup data
    const backupData = await this.collectBackupData();

    logger.info('Configuration exported', { userId });

    return backupData;
  }

  /**
   * Import configuration (restore from backup)
   */
  async importConfig(backupData: any, userId?: string) {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Invalid backup data');
    }

    const results: ImportResults = {
      domains: 0,
      vhostConfigs: 0,
      upstreams: 0,
      loadBalancers: 0,
      ssl: 0,
      sslFiles: 0,
      modsecCRS: 0,
      modsecCustom: 0,
      acl: 0,
      alertChannels: 0,
      alertRules: 0,
      users: 0,
      nginxConfigs: 0,
      networkLoadBalancers: 0,
      nlbUpstreams: 0,
    };

    // 1. Restore domains
    if (backupData.domains && Array.isArray(backupData.domains)) {
      for (const domainData of backupData.domains) {
        await this.restoreDomain(domainData, results);
      }
    }

    // 2. Restore SSL certificates
    if (backupData.ssl && Array.isArray(backupData.ssl)) {
      for (const sslCert of backupData.ssl) {
        await this.restoreSSLCertificate(sslCert, results);
      }
    }

    // 3. Restore ModSecurity configurations
    if (backupData.modsec) {
      await this.restoreModSecRules(backupData.modsec, results);
    }

    // 4. Restore ACL rules
    if (backupData.acl && Array.isArray(backupData.acl)) {
      for (const rule of backupData.acl) {
        await this.restoreACLRule(rule, results);
      }
    }

    // 5. Restore notification channels
    if (backupData.notificationChannels && Array.isArray(backupData.notificationChannels)) {
      for (const channel of backupData.notificationChannels) {
        await this.restoreNotificationChannel(channel, results);
      }
    }

    // 6. Restore alert rules
    if (backupData.alertRules && Array.isArray(backupData.alertRules)) {
      for (const rule of backupData.alertRules) {
        await this.restoreAlertRule(rule, results);
      }
    }

    // 7. Restore users
    if (backupData.users && Array.isArray(backupData.users)) {
      for (const userData of backupData.users) {
        await this.restoreUser(userData, results);
      }
    }

    // 8. Restore nginx global configs
    if (backupData.nginxConfigs && Array.isArray(backupData.nginxConfigs)) {
      for (const config of backupData.nginxConfigs) {
        await this.restoreNginxConfig(config, results);
      }
    }

    // 9. Restore Network Load Balancers
    if (backupData.networkLoadBalancers && Array.isArray(backupData.networkLoadBalancers)) {
      for (const nlbData of backupData.networkLoadBalancers) {
        await this.restoreNetworkLoadBalancer(nlbData, results);
      }
    }

    logger.info('Configuration imported successfully', { userId, results });

    // Reload nginx
    logger.info('Reloading nginx after restore...');
    const nginxReloaded = await this.reloadNginx();

    if (!nginxReloaded) {
      logger.warn('Nginx reload failed, but restore completed.');
    }

    return { results, nginxReloaded };
  }

  /**
   * Get all backup files
   */
  async getBackupFiles(scheduleId?: string): Promise<FormattedBackupFile[]> {
    const backups = await backupRepository.findAllBackupFiles(scheduleId);

    return backups.map((backup) => ({
      ...backup,
      size: this.formatBytes(Number(backup.size)),
      schedule: backup.schedule || undefined,
    }));
  }

  /**
   * Get backup file by ID
   */
  async getBackupFileById(id: string) {
    const backup = await backupRepository.findBackupFileById(id);
    if (!backup) {
      throw new Error('Backup file not found');
    }
    return backup;
  }

  /**
   * Delete backup file
   */
  async deleteBackupFile(id: string, userId?: string) {
    const backup = await backupRepository.findBackupFileById(id);
    if (!backup) {
      throw new Error('Backup file not found');
    }

    // Delete file from disk
    try {
      await fs.unlink(backup.filepath);
    } catch (error) {
      logger.warn(`Failed to delete backup file from disk: ${backup.filepath}`, error);
    }

    // Delete from database
    await backupRepository.deleteBackupFile(id);

    logger.info(`Backup deleted: ${backup.filename}`, { userId });
  }

  /**
   * Collect all backup data
   */
  private async collectBackupData(): Promise<BackupData> {
    // Get all domains
    const domains = await backupRepository.getAllDomainsForBackup();

    // Read nginx vhost configs
    const domainsWithVhostConfig = await Promise.all(
      domains.map(async (d) => {
        const vhostConfig = await this.readNginxVhostConfig(d.name);

        return {
          name: d.name,
          status: d.status,
          sslEnabled: d.sslEnabled,
          modsecEnabled: d.modsecEnabled,
          upstreams: d.upstreams,
          loadBalancer: d.loadBalancer,
          vhostConfig: vhostConfig?.config,
          vhostEnabled: vhostConfig?.enabled,
        };
      })
    );

    // Get SSL certificates
    const ssl = await backupRepository.getAllSSLCertificates();

    // Read SSL certificate files
    const sslWithFiles = await Promise.all(
      ssl.map(async (s) => {
        if (!s.domain?.name) {
          return {
            domainName: s.domain?.name || '',
            commonName: s.commonName,
            sans: s.sans,
            issuer: s.issuer,
            autoRenew: s.autoRenew,
            validFrom: s.validFrom,
            validTo: s.validTo,
          };
        }

        const sslFiles = await this.readSSLCertificateFiles(s.domain.name);

        return {
          domainName: s.domain.name,
          commonName: s.commonName,
          sans: s.sans,
          issuer: s.issuer,
          autoRenew: s.autoRenew,
          validFrom: s.validFrom,
          validTo: s.validTo,
          files: sslFiles,
        };
      })
    );

    // Get ModSec rules
    const modsecCRSRules = await backupRepository.getAllModSecCRSRules();
    const modsecCustomRules = await backupRepository.getAllModSecCustomRules();
    const modsecGlobalSettings = await backupRepository.getAllNginxConfigs();

    // Get ACL rules
    const aclRules = await backupRepository.getAllACLRules();

    // Get notification channels
    const notificationChannels = await backupRepository.getAllNotificationChannels();

    // Get alert rules
    const alertRules = await backupRepository.getAllAlertRules();

    // Get users
    const users = await backupRepository.getAllUsers();

    // Get nginx configs
    const nginxConfigs = await backupRepository.getAllNginxConfigs();

    // Get Network Load Balancers
    const networkLoadBalancers = await backupRepository.getAllNetworkLoadBalancers();

    return {
      version: BACKUP_CONSTANTS.BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      domains: domainsWithVhostConfig,
      ssl: sslWithFiles,
      modsec: {
        globalSettings: modsecGlobalSettings,
        crsRules: modsecCRSRules,
        customRules: modsecCustomRules,
      },
      acl: aclRules.map((r) => ({
        name: r.name,
        type: r.type,
        condition: {
          field: r.conditionField,
          operator: r.conditionOperator,
          value: r.conditionValue,
        },
        action: r.action,
        enabled: r.enabled,
      })),
      notificationChannels,
      alertRules: alertRules.map((r) => ({
        name: r.name,
        condition: r.condition,
        threshold: r.threshold,
        severity: r.severity,
        enabled: r.enabled,
        channels: r.channels.map((c) => c.channel.name),
      })),
      users,
      nginxConfigs,
      networkLoadBalancers: networkLoadBalancers.map((nlb) => ({
        name: nlb.name,
        description: nlb.description || undefined,
        port: nlb.port,
        protocol: nlb.protocol,
        algorithm: nlb.algorithm,
        status: nlb.status,
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
        upstreams: nlb.upstreams.map((u) => ({
          host: u.host,
          port: u.port,
          weight: u.weight,
          maxFails: u.maxFails,
          failTimeout: u.failTimeout,
          maxConns: u.maxConns,
          backup: u.backup,
          down: u.down,
          status: u.status,
        })),
      })),
    };
  }

  /**
   * Read nginx vhost configuration
   */
  private async readNginxVhostConfig(domainName: string) {
    try {
      const vhostPath = path.join(
        BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE,
        `${domainName}.conf`
      );
      const vhostConfig = await fs.readFile(vhostPath, 'utf-8');

      let isEnabled = false;
      try {
        const enabledPath = path.join(
          BACKUP_CONSTANTS.NGINX_SITES_ENABLED,
          `${domainName}.conf`
        );
        await fs.access(enabledPath);
        isEnabled = true;
      } catch {
        isEnabled = false;
      }

      return {
        domainName,
        config: vhostConfig,
        enabled: isEnabled,
      };
    } catch (error) {
      logger.warn(`Nginx vhost config not found for ${domainName}`);
      return null;
    }
  }

  /**
   * Write nginx vhost configuration
   */
  private async writeNginxVhostConfig(
    domainName: string,
    config: string,
    enabled: boolean = true
  ) {
    await fs.mkdir(BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE, { recursive: true });
    await fs.mkdir(BACKUP_CONSTANTS.NGINX_SITES_ENABLED, { recursive: true });

    const vhostPath = path.join(
      BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE,
      `${domainName}.conf`
    );
    await fs.writeFile(vhostPath, config, 'utf-8');
    logger.info(`Nginx vhost config written for ${domainName}`);

    if (enabled) {
      const enabledPath = path.join(
        BACKUP_CONSTANTS.NGINX_SITES_ENABLED,
        `${domainName}.conf`
      );
      try {
        await fs.unlink(enabledPath);
      } catch {
        // Ignore
      }
      await fs.symlink(vhostPath, enabledPath);
      logger.info(`Nginx vhost enabled for ${domainName}`);
    }
  }

  /**
   * Read SSL certificate files
   */
  private async readSSLCertificateFiles(
    domainName: string
  ): Promise<SSLCertificateFiles> {
    const certPath = path.join(BACKUP_CONSTANTS.SSL_CERTS_PATH, `${domainName}.crt`);
    const keyPath = path.join(BACKUP_CONSTANTS.SSL_CERTS_PATH, `${domainName}.key`);
    const chainPath = path.join(
      BACKUP_CONSTANTS.SSL_CERTS_PATH,
      `${domainName}.chain.crt`
    );

    const sslFiles: SSLCertificateFiles = {};

    try {
      sslFiles.certificate = await fs.readFile(certPath, 'utf-8');
    } catch {
      logger.warn(`SSL certificate not found for ${domainName}`);
    }

    try {
      sslFiles.privateKey = await fs.readFile(keyPath, 'utf-8');
    } catch {
      logger.warn(`SSL private key not found for ${domainName}`);
    }

    try {
      sslFiles.chain = await fs.readFile(chainPath, 'utf-8');
    } catch {
      // Chain is optional
    }

    return sslFiles;
  }

  /**
   * Write SSL certificate files
   */
  private async writeSSLCertificateFiles(
    domainName: string,
    sslFiles: SSLCertificateFiles
  ) {
    await fs.mkdir(BACKUP_CONSTANTS.SSL_CERTS_PATH, { recursive: true });

    if (sslFiles.certificate) {
      const certPath = path.join(
        BACKUP_CONSTANTS.SSL_CERTS_PATH,
        `${domainName}.crt`
      );
      await fs.writeFile(certPath, sslFiles.certificate, 'utf-8');
      logger.info(`SSL certificate written for ${domainName}`);
    }

    if (sslFiles.privateKey) {
      const keyPath = path.join(BACKUP_CONSTANTS.SSL_CERTS_PATH, `${domainName}.key`);
      await fs.writeFile(keyPath, sslFiles.privateKey, 'utf-8');
      await fs.chmod(keyPath, 0o600);
      logger.info(`SSL private key written for ${domainName}`);
    }

    if (sslFiles.chain) {
      const chainPath = path.join(
        BACKUP_CONSTANTS.SSL_CERTS_PATH,
        `${domainName}.chain.crt`
      );
      await fs.writeFile(chainPath, sslFiles.chain, 'utf-8');
      logger.info(`SSL chain written for ${domainName}`);
    }
  }

  /**
   * Restore domain from backup data
   */
  private async restoreDomain(domainData: any, results: ImportResults) {
    try {
      const domain = await backupRepository.upsertDomain(
        domainData.name,
        {
          name: domainData.name,
          status: domainData.status,
          sslEnabled: domainData.sslEnabled,
          modsecEnabled: domainData.modsecEnabled,
        },
        {
          status: domainData.status,
          sslEnabled: domainData.sslEnabled,
          modsecEnabled: domainData.modsecEnabled,
        }
      );
      results.domains++;

      // Restore upstreams
      if (domainData.upstreams && Array.isArray(domainData.upstreams)) {
        await backupRepository.deleteUpstreamsByDomainId(domain.id);

        for (const upstream of domainData.upstreams) {
          await backupRepository.createUpstream({
            domain: { connect: { id: domain.id } },
            host: upstream.host,
            port: upstream.port,
            protocol: upstream.protocol || 'http',
            sslVerify: upstream.sslVerify ?? false,
            weight: upstream.weight || 1,
            maxFails: upstream.maxFails || 3,
            failTimeout: upstream.failTimeout || 30,
            status: upstream.status || 'up',
          });
          results.upstreams++;
        }
      }

      // Restore load balancer config
      if (domainData.loadBalancer) {
        const lb = domainData.loadBalancer;
        const healthCheck = lb.healthCheck || {};

        await backupRepository.upsertLoadBalancerConfig(domain.id, {
          algorithm: lb.algorithm || 'round_robin',
          healthCheckEnabled: lb.healthCheckEnabled ?? healthCheck.enabled ?? true,
          healthCheckInterval: lb.healthCheckInterval ?? healthCheck.interval ?? 30,
          healthCheckTimeout: lb.healthCheckTimeout ?? healthCheck.timeout ?? 5,
          healthCheckPath: lb.healthCheckPath ?? healthCheck.path ?? '/',
        });
        results.loadBalancers++;
      }

      // Restore vhost config
      if (domainData.vhostConfig) {
        await this.writeNginxVhostConfig(
          domainData.name,
          domainData.vhostConfig,
          domainData.vhostEnabled ?? true
        );
        results.vhostConfigs++;
      } else {
        // Generate config if not in backup
        const fullDomain = await backupRepository.findDomainByIdWithRelations(domain.id);
        if (fullDomain) {
          await this.generateNginxConfigForBackup(fullDomain);
          results.vhostConfigs++;
        }
      }
    } catch (error) {
      logger.error(`Failed to restore domain ${domainData.name}:`, error);
    }
  }

  /**
   * Restore SSL certificate
   */
  private async restoreSSLCertificate(sslCert: any, results: ImportResults) {
    try {
      const domain = await backupRepository.findDomainByName(sslCert.domainName);
      if (!domain) {
        logger.warn(`Domain not found for SSL cert: ${sslCert.domainName}`);
        return;
      }

      if (sslCert.files && sslCert.files.certificate && sslCert.files.privateKey) {
        await backupRepository.upsertSSLCertificate(
          domain.id,
          {
            domain: { connect: { id: domain.id } },
            commonName: sslCert.commonName,
            sans: sslCert.sans || [],
            issuer: sslCert.issuer,
            certificate: sslCert.files.certificate,
            privateKey: sslCert.files.privateKey,
            chain: sslCert.files.chain || null,
            validFrom: sslCert.validFrom ? new Date(sslCert.validFrom) : new Date(),
            validTo: sslCert.validTo
              ? new Date(sslCert.validTo)
              : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            autoRenew: sslCert.autoRenew || false,
          },
          {
            commonName: sslCert.commonName,
            sans: sslCert.sans || [],
            issuer: sslCert.issuer,
            certificate: sslCert.files.certificate,
            privateKey: sslCert.files.privateKey,
            chain: sslCert.files.chain || null,
            autoRenew: sslCert.autoRenew || false,
          }
        );

        await this.writeSSLCertificateFiles(sslCert.domainName, {
          certificate: sslCert.files.certificate,
          privateKey: sslCert.files.privateKey,
          chain: sslCert.files.chain,
        });

        results.ssl++;
        results.sslFiles++;
      }
    } catch (error) {
      logger.error(`Failed to restore SSL cert for ${sslCert.domainName}:`, error);
    }
  }

  /**
   * Restore ModSec rules
   */
  private async restoreModSecRules(modsec: any, results: ImportResults) {
    // CRS rules
    if (modsec.crsRules && Array.isArray(modsec.crsRules)) {
      for (const rule of modsec.crsRules) {
        try {
          await backupRepository.upsertModSecCRSRule(
            rule.ruleFile,
            rule.domainId || null,
            {
              enabled: rule.enabled,
              name: rule.name || rule.ruleFile,
              category: rule.category || 'OWASP',
              paranoia: rule.paranoia || 1,
            }
          );
          results.modsecCRS++;
        } catch (error) {
          logger.error(`Failed to restore CRS rule ${rule.ruleFile}:`, error);
        }
      }
    }

    // Custom rules
    if (modsec.customRules && Array.isArray(modsec.customRules)) {
      for (const rule of modsec.customRules) {
        try {
          await backupRepository.createModSecRule({
            domain: rule.domainId ? { connect: { id: rule.domainId } } : undefined,
            name: rule.name,
            ruleContent: rule.content || rule.ruleContent || '',
            enabled: rule.enabled,
            category: rule.category || 'custom',
          });
          results.modsecCustom++;
        } catch (error) {
          logger.error(`Failed to restore custom ModSec rule ${rule.name}:`, error);
        }
      }
    }
  }

  /**
   * Restore ACL rule
   */
  private async restoreACLRule(rule: any, results: ImportResults) {
    try {
      await backupRepository.createACLRule({
        name: rule.name,
        type: rule.type,
        conditionField: rule.condition.field,
        conditionOperator: rule.condition.operator,
        conditionValue: rule.condition.value,
        action: rule.action,
        enabled: rule.enabled,
      });
      results.acl++;
    } catch (error) {
      logger.error(`Failed to restore ACL rule ${rule.name}:`, error);
    }
  }

  /**
   * Restore notification channel
   */
  private async restoreNotificationChannel(channel: any, results: ImportResults) {
    try {
      await backupRepository.createNotificationChannel({
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config,
      });
      results.alertChannels++;
    } catch (error) {
      logger.error(`Failed to restore notification channel ${channel.name}:`, error);
    }
  }

  /**
   * Restore alert rule
   */
  private async restoreAlertRule(rule: any, results: ImportResults) {
    try {
      const alertRule = await backupRepository.createAlertRule({
        name: rule.name,
        condition: rule.condition,
        threshold: rule.threshold,
        severity: rule.severity,
        enabled: rule.enabled,
      });

      if (rule.channels && Array.isArray(rule.channels)) {
        for (const channelName of rule.channels) {
          const channel = await backupRepository.findNotificationChannelByName(
            channelName
          );
          if (channel) {
            await backupRepository.createAlertRuleChannel(alertRule.id, channel.id);
          }
        }
      }
      results.alertRules++;
    } catch (error) {
      logger.error(`Failed to restore alert rule ${rule.name}:`, error);
    }
  }

  /**
   * Restore user
   */
  private async restoreUser(userData: any, results: ImportResults) {
    try {
      const user = await backupRepository.upsertUser(
        userData.username,
        {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName || userData.username,
          status: userData.status || 'active',
          role: userData.role || 'viewer',
          avatar: userData.avatar,
          phone: userData.phone,
          timezone: userData.timezone || 'UTC',
          language: userData.language || 'en',
          lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : null,
          profile: userData.profile
            ? {
                create: {
                  bio: userData.profile.bio || null,
                  location: userData.profile.location || null,
                  website: userData.profile.website || null,
                },
              }
            : undefined,
        },
        {
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName || userData.username,
          status: userData.status || 'active',
          role: userData.role || 'viewer',
          avatar: userData.avatar,
          phone: userData.phone,
          timezone: userData.timezone || 'UTC',
          language: userData.language || 'en',
          lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : null,
        }
      );

      if (userData.profile) {
        await backupRepository.upsertUserProfile(user.id, {
          bio: userData.profile.bio || null,
          location: userData.profile.location || null,
          website: userData.profile.website || null,
        });
      }

      results.users++;
      logger.info(`User ${userData.username} restored`);
    } catch (error) {
      logger.error(`Failed to restore user ${userData.username}:`, error);
    }
  }

  /**
   * Restore nginx config
   */
  private async restoreNginxConfig(config: any, results: ImportResults) {
    try {
      await backupRepository.upsertNginxConfig(
        config.id,
        {
          configType: config.configType || 'main',
          name: config.name || 'config',
          content: config.content || config.config || config.value || '',
          enabled: config.enabled ?? true,
        },
        {
          content: config.content || config.config || config.value || '',
          enabled: config.enabled ?? true,
        }
      );
      results.nginxConfigs++;
    } catch (error) {
      logger.error(`Failed to restore nginx config ${config.id}:`, error);
    }
  }

  /**
   * Restore Network Load Balancer
   */
  private async restoreNetworkLoadBalancer(nlbData: any, results: ImportResults) {
    try {
      const nlb = await backupRepository.upsertNetworkLoadBalancer(
        nlbData.name,
        {
          description: nlbData.description,
          port: nlbData.port,
          protocol: nlbData.protocol,
          algorithm: nlbData.algorithm,
          status: nlbData.status || 'inactive',
          enabled: nlbData.enabled ?? true,
          proxyTimeout: nlbData.proxyTimeout ?? 3,
          proxyConnectTimeout: nlbData.proxyConnectTimeout ?? 1,
          proxyNextUpstream: nlbData.proxyNextUpstream ?? true,
          proxyNextUpstreamTimeout: nlbData.proxyNextUpstreamTimeout ?? 0,
          proxyNextUpstreamTries: nlbData.proxyNextUpstreamTries ?? 0,
          healthCheckEnabled: nlbData.healthCheckEnabled ?? true,
          healthCheckInterval: nlbData.healthCheckInterval ?? 10,
          healthCheckTimeout: nlbData.healthCheckTimeout ?? 5,
          healthCheckRises: nlbData.healthCheckRises ?? 2,
          healthCheckFalls: nlbData.healthCheckFalls ?? 3,
        },
        {
          description: nlbData.description,
          port: nlbData.port,
          protocol: nlbData.protocol,
          algorithm: nlbData.algorithm,
          status: nlbData.status || 'inactive',
          enabled: nlbData.enabled ?? true,
          proxyTimeout: nlbData.proxyTimeout ?? 3,
          proxyConnectTimeout: nlbData.proxyConnectTimeout ?? 1,
          proxyNextUpstream: nlbData.proxyNextUpstream ?? true,
          proxyNextUpstreamTimeout: nlbData.proxyNextUpstreamTimeout ?? 0,
          proxyNextUpstreamTries: nlbData.proxyNextUpstreamTries ?? 0,
          healthCheckEnabled: nlbData.healthCheckEnabled ?? true,
          healthCheckInterval: nlbData.healthCheckInterval ?? 10,
          healthCheckTimeout: nlbData.healthCheckTimeout ?? 5,
          healthCheckRises: nlbData.healthCheckRises ?? 2,
          healthCheckFalls: nlbData.healthCheckFalls ?? 3,
        }
      );

      results.networkLoadBalancers++;

      // Restore upstreams
      if (nlbData.upstreams && Array.isArray(nlbData.upstreams)) {
        await backupRepository.deleteNLBUpstreamsByNLBId(nlb.id);

        for (const upstream of nlbData.upstreams) {
          await backupRepository.createNLBUpstream({
            nlb: { connect: { id: nlb.id } },
            host: upstream.host,
            port: upstream.port,
            weight: upstream.weight ?? 1,
            maxFails: upstream.maxFails ?? 3,
            failTimeout: upstream.failTimeout ?? 10,
            maxConns: upstream.maxConns ?? 0,
            backup: upstream.backup ?? false,
            down: upstream.down ?? false,
            status: upstream.status || 'checking',
          });
          results.nlbUpstreams++;
        }
      }

      logger.info(`Network Load Balancer ${nlbData.name} restored`);
    } catch (error) {
      logger.error(`Failed to restore Network Load Balancer ${nlbData.name}:`, error);
    }
  }

  /**
   * Generate nginx config for backup restore
   */
  private async generateNginxConfigForBackup(domain: any): Promise<void> {
    const configPath = path.join(
      BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE,
      `${domain.name}.conf`
    );
    const enabledPath = path.join(
      BACKUP_CONSTANTS.NGINX_SITES_ENABLED,
      `${domain.name}.conf`
    );

    const hasHttpsUpstream =
      domain.upstreams?.some((u: any) => u.protocol === 'https') || false;
    const upstreamProtocol = hasHttpsUpstream ? 'https' : 'http';

    // Calculate keepalive connections: 10 connections per backend
    const backendCount = domain.upstreams?.length || 0;
    const keepaliveConnections = backendCount * 10;

    // Generate WebSocket map block
    const websocketMapBlock = `
# WebSocket support - Map for connection upgrade
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

`;

    const upstreamBlock = `
upstream ${domain.name.replace(/\./g, '_')}_backend {
    ${domain.loadBalancer?.algorithm === 'least_conn' ? 'least_conn;' : ''}
    ${domain.loadBalancer?.algorithm === 'ip_hash' ? 'ip_hash;' : ''}

    ${(domain.upstreams || [])
      .map(
        (u: any) =>
          `server ${u.host}:${u.port} weight=${u.weight || 1} max_fails=${
            u.maxFails || 3
          } fail_timeout=${u.failTimeout || 10}s;`
      )
      .join('\n    ')}
    
    # Keepalive connections - 10 per backend (${backendCount} backends)
    keepalive ${keepaliveConnections};
}
`;

    let httpServerBlock = `
server {
    listen 80;
    server_name ${domain.name};

    include /etc/nginx/conf.d/acl-rules.conf;
    include /etc/nginx/snippets/acme-challenge.conf;

    ${
      domain.sslEnabled
        ? `
    return 301 https://$server_name$request_uri;
    `
        : `
    ${domain.modsecEnabled ? 'modsecurity on;' : 'modsecurity off;'}

    access_log /var/log/nginx/${domain.name}_access.log main;
    error_log /var/log/nginx/${domain.name}_error.log warn;

    location / {
        proxy_pass ${upstreamProtocol}://${domain.name.replace(/\./g, '_')}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /nginx_health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    `
    }
}
`;

    let httpsServerBlock = '';
    if (domain.sslEnabled && domain.sslCertificate) {
      httpsServerBlock = `
server {
    listen 443 ssl http2;
    server_name ${domain.name};

    include /etc/nginx/conf.d/acl-rules.conf;

    ssl_certificate /etc/nginx/ssl/${domain.name}.crt;
    ssl_certificate_key /etc/nginx/ssl/${domain.name}.key;
    ${
      domain.sslCertificate.chain
        ? `ssl_trusted_certificate /etc/nginx/ssl/${domain.name}.chain.crt;`
        : ''
    }

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    ${domain.modsecEnabled ? 'modsecurity on;' : 'modsecurity off;'}

    access_log /var/log/nginx/${domain.name}_ssl_access.log main;
    error_log /var/log/nginx/${domain.name}_ssl_error.log warn;

    location / {
        proxy_pass ${upstreamProtocol}://${domain.name.replace(/\./g, '_')}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /nginx_health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
`;
    }

    const fullConfig = websocketMapBlock + upstreamBlock + httpServerBlock + httpsServerBlock;

    await fs.mkdir(BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE, { recursive: true });
    await fs.mkdir(BACKUP_CONSTANTS.NGINX_SITES_ENABLED, { recursive: true });
    await fs.writeFile(configPath, fullConfig);

    if (domain.status === 'active') {
      try {
        await fs.unlink(enabledPath);
      } catch {
        // Ignore
      }
      await fs.symlink(configPath, enabledPath);
    }

    logger.info(`Nginx configuration generated for ${domain.name}`);
  }
}

// Export singleton instance
export const backupService = new BackupService();

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import logger from '../../utils/logger';
import { PATHS } from '../../shared/constants/paths.constants';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
import { NLBRepository } from './nlb.repository';
import {
  CreateNLBInput,
  UpdateNLBInput,
  NLBWithRelations,
  NLBQueryOptions,
  HealthCheckResult,
  NLBStats,
} from './nlb.types';
import { PaginationMeta } from '../../shared/types/common.types';
import { AppError } from '../../middleware/errorHandler';

// Well-known ports reserved by the system/nginx that NLB must not use
export const RESERVED_PORTS = [
  80,    // HTTP
  443,   // HTTPS
  22,    // SSH
  25,    // SMTP
  53,    // DNS
  3306,  // MySQL
  5432,  // PostgreSQL
  6379,  // Redis
  8080,  // Nginx panel (frontend)
  3001,  // API backend
];

/**
 * Service for Network Load Balancer business logic
 */
export class NLBService {
  private repository: NLBRepository;
  private readonly streamsAvailablePath = '/etc/nginx/streams-available';
  private readonly streamsEnabledPath = '/etc/nginx/streams-enabled';
  private readonly streamIncludeFile = '/etc/nginx/stream.conf';

  constructor() {
    this.repository = new NLBRepository();
  }

  /**
   * Check if a port is currently in use on the system by another process.
   * Uses `ss` via execFile to detect listening sockets (safe from command injection).
   * Ignores ports already owned by an existing NLB (identified via its database record).
   */
  async isPortInUseOnSystem(port: number, excludeNLBId?: string): Promise<boolean> {
    // First, check against the reserved ports list
    if (RESERVED_PORTS.includes(port)) {
      return true;
    }

    // Check if port is used by another NLB in the database
    const existingByPort = await this.repository.findByPort(port);
    if (existingByPort && existingByPort.id !== excludeNLBId) {
      return true;
    }

    // Check if port is in use on the system by any process using execFile (safe from injection)
    const portStr = String(Math.floor(port));
    try {
      const { stdout } = await execFileAsync('ss', ['-tlnH', 'sport', '=', `:${portStr}`]);
      if (stdout.trim().length > 0) {
        return true;
      }
    } catch {
      // TCP check failed or no results - try UDP
    }

    try {
      const { stdout } = await execFileAsync('ss', ['-ulnH', 'sport', '=', `:${portStr}`]);
      if (stdout.trim().length > 0) {
        return true;
      }
    } catch {
      // UDP check failed - fall through
      logger.warn(`Could not check system port usage for port ${port}`);
    }

    return false;
  }

  /**
   * Build a user-friendly message explaining why a port cannot be used.
   */
  getPortConflictMessage(port: number, existingNLBName?: string): string {
    if (RESERVED_PORTS.includes(port)) {
      return `Port ${port} is reserved by the system and cannot be used for NLB`;
    }
    if (existingNLBName) {
      return `Port ${port} is already in use by NLB "${existingNLBName}"`;
    }
    return `Port ${port} is already in use by another process on the system`;
  }

  /**
   * Get all NLBs with pagination
   */
  async getAllNLBs(
    options: NLBQueryOptions
  ): Promise<{ nlbs: NLBWithRelations[]; pagination: PaginationMeta }> {
    return this.repository.findAll(options);
  }

  /**
   * Get NLB by ID
   */
  async getNLBById(id: string): Promise<NLBWithRelations> {
    const nlb = await this.repository.findById(id);
    if (!nlb) {
      throw new AppError('NLB not found', 404);
    }
    return nlb;
  }

  /**
   * Create new NLB
   */
  async createNLB(input: CreateNLBInput): Promise<NLBWithRelations> {
    // Validate port range
    if (input.port < 1 || input.port > 65535) {
      throw new AppError('NLB port must be between 1 and 65535', 400);
    }

    // Check if name already exists
    const existingByName = await this.repository.findByName(input.name);
    if (existingByName) {
      throw new AppError(`NLB with name "${input.name}" already exists`, 409);
    }

    // Check for port conflicts (reserved ports, other NLBs, system processes)
    const existingByPort = await this.repository.findByPort(input.port);
    if (existingByPort) {
      throw new AppError(this.getPortConflictMessage(input.port, existingByPort.name), 409);
    }

    const portInUse = await this.isPortInUseOnSystem(input.port);
    if (portInUse) {
      throw new AppError(this.getPortConflictMessage(input.port), 409);
    }

    // Create NLB in database
    const nlb = await this.repository.create(input);

    // Generate Nginx stream configuration
    try {
      await this.generateStreamConfig(nlb);
      await this.enableStreamConfig(nlb.name);
      await this.ensureStreamInclude();
      await this.testNginxConfig();
      await this.reloadNginx();
      
      // Update status to active
      await this.repository.updateStatus(nlb.id, 'active');
      
      // Perform initial health check if enabled
      if (nlb.healthCheckEnabled) {
        try {
          await this.performHealthCheck(nlb.id);
          logger.info(`Initial health check completed for NLB: ${nlb.name}`);
        } catch (error) {
          logger.warn(`Initial health check failed for NLB: ${nlb.name}`, error);
          // Don't fail NLB creation if health check fails
        }
      }
      
      logger.info(`NLB created successfully: ${nlb.name}`);
      return this.repository.findById(nlb.id) as Promise<NLBWithRelations>;
    } catch (error) {
      logger.error(`Failed to create NLB config for ${nlb.name}:`, error);
      await this.repository.updateStatus(nlb.id, 'error');
      throw new AppError('Failed to create NLB configuration', 500);
    }
  }

  /**
   * Update NLB
   */
  async updateNLB(id: string, input: UpdateNLBInput): Promise<NLBWithRelations> {
    const nlb = await this.getNLBById(id);

    // Validate port if changed
    if (input.port !== undefined && (input.port < 1 || input.port > 65535)) {
      throw new AppError('NLB port must be between 1 and 65535', 400);
    }

    // Check if name already exists (if changing name)
    if (input.name && input.name !== nlb.name) {
      const existingByName = await this.repository.findByName(input.name);
      if (existingByName) {
        throw new AppError(`NLB with name "${input.name}" already exists`, 409);
      }
    }

    // Check if port already in use (if changing port)
    if (input.port && input.port !== nlb.port) {
      const existingByPort = await this.repository.findByPort(input.port);
      if (existingByPort && existingByPort.id !== id) {
        throw new AppError(this.getPortConflictMessage(input.port, existingByPort.name), 409);
      }

      const portInUse = await this.isPortInUseOnSystem(input.port, id);
      if (portInUse) {
        throw new AppError(this.getPortConflictMessage(input.port), 409);
      }
    }

    // Update NLB in database
    const updatedNLB = await this.repository.update(id, input);

    // Regenerate Nginx configuration if enabled
    if (updatedNLB.enabled) {
      try {
        await this.generateStreamConfig(updatedNLB);
        await this.enableStreamConfig(updatedNLB.name);
        await this.testNginxConfig();
        await this.reloadNginx();
        await this.repository.updateStatus(id, 'active');
        logger.info(`NLB updated successfully: ${updatedNLB.name}`);
      } catch (error) {
        logger.error(`Failed to update NLB config for ${updatedNLB.name}:`, error);
        await this.repository.updateStatus(id, 'error');
        throw new AppError('Failed to update NLB configuration', 500);
      }
    } else {
      // If disabled, disable symlink
      await this.disableStreamConfig(nlb.name);
      await this.testNginxConfig();
      await this.reloadNginx();
      await this.repository.updateStatus(id, 'inactive');
    }

    return this.repository.findById(id) as Promise<NLBWithRelations>;
  }

  /**
   * Delete NLB
   */
  async deleteNLB(id: string): Promise<void> {
    const nlb = await this.getNLBById(id);

    // Remove Nginx configuration
    await this.disableStreamConfig(nlb.name);
    await this.removeStreamConfig(nlb.name);
    await this.testNginxConfig();
    await this.reloadNginx();

    // Delete from database
    await this.repository.delete(id);

    logger.info(`NLB deleted successfully: ${nlb.name}`);
  }

  /**
   * Toggle NLB enabled status
   */
  async toggleNLB(id: string, enabled: boolean): Promise<NLBWithRelations> {
    const nlb = await this.getNLBById(id);

    if (enabled) {
      // Enable: generate config and create symlink
      await this.generateStreamConfig(nlb);
      await this.enableStreamConfig(nlb.name);
      await this.testNginxConfig();
      await this.reloadNginx();
      await this.repository.toggleEnabled(id, true);
      await this.repository.updateStatus(id, 'active');
      logger.info(`NLB enabled: ${nlb.name}`);
    } else {
      // Disable: remove symlink
      await this.disableStreamConfig(nlb.name);
      await this.testNginxConfig();
      await this.reloadNginx();
      await this.repository.toggleEnabled(id, false);
      await this.repository.updateStatus(id, 'inactive');
      logger.info(`NLB disabled: ${nlb.name}`);
    }

    return this.repository.findById(id) as Promise<NLBWithRelations>;
  }

  /**
   * Get NLB statistics
   */
  async getStats(): Promise<NLBStats> {
    return this.repository.getStats();
  }

  /**
   * Generate Nginx stream configuration for NLB
   * Tạo file config trong streams-available (tương tự sites-available)
   */
  private async generateStreamConfig(nlb: NLBWithRelations): Promise<void> {
    const configPath = path.join(this.streamsAvailablePath, `${nlb.name}.conf`);

    // Generate upstream block
    const upstreamName = nlb.name.replace(/[^a-zA-Z0-9_]/g, '_');
    const algorithm = this.getAlgorithmDirective(nlb.algorithm);
    
    const upstreamServers = nlb.upstreams
      .map((u) => {
        const params = [];
        if (u.weight !== 1) params.push(`weight=${u.weight}`);
        if (u.maxFails !== 3) params.push(`max_fails=${u.maxFails}`);
        if (u.failTimeout !== 10) params.push(`fail_timeout=${u.failTimeout}s`);
        if (u.maxConns > 0) params.push(`max_conns=${u.maxConns}`);
        if (u.backup) params.push('backup');
        if (u.down) params.push('down');
        
        return `    server ${u.host}:${u.port}${params.length > 0 ? ' ' + params.join(' ') : ''};`;
      })
      .join('\n');

    const upstreamBlock = `upstream ${upstreamName} {
${algorithm ? `    ${algorithm}\n` : ''}${upstreamServers}
}`;

    // Generate server blocks based on protocol
    const serverBlocks = [];
    
    if (nlb.protocol === 'tcp' || nlb.protocol === 'tcp_udp') {
      serverBlocks.push(this.generateServerBlock(nlb, upstreamName, false));
    }
    
    if (nlb.protocol === 'udp' || nlb.protocol === 'tcp_udp') {
      serverBlocks.push(this.generateServerBlock(nlb, upstreamName, true));
    }

    const fullConfig = `# Network Load Balancer: ${nlb.name}
# Protocol: ${nlb.protocol}
# Port: ${nlb.port}
# Algorithm: ${nlb.algorithm}
# Generated at: ${new Date().toISOString()}
# DO NOT EDIT THIS FILE MANUALLY - Managed by Nginx WAF Management Platform

${upstreamBlock}

${serverBlocks.join('\n\n')}
`;

    // Write configuration file to streams-available
    try {
      await fs.mkdir(this.streamsAvailablePath, { recursive: true });
      await fs.mkdir(this.streamsEnabledPath, { recursive: true });
      await fs.writeFile(configPath, fullConfig);
      logger.info(`Stream configuration written to streams-available for NLB: ${nlb.name}`);
    } catch (error) {
      logger.error(`Failed to write stream config for ${nlb.name}:`, error);
      throw error;
    }
  }

  /**
   * Generate server block for stream
   */
  private generateServerBlock(nlb: NLBWithRelations, upstreamName: string, isUdp: boolean): string {
    const protocol = isUdp ? ' udp' : '';
    const lines = [];

    lines.push(`server {`);
    lines.push(`    listen ${nlb.port}${protocol};`);
    lines.push(`    proxy_pass ${upstreamName};`);
    
    if (nlb.proxyTimeout !== 3) {
      lines.push(`    proxy_timeout ${nlb.proxyTimeout}s;`);
    }
    
    if (nlb.proxyConnectTimeout !== 1) {
      lines.push(`    proxy_connect_timeout ${nlb.proxyConnectTimeout}s;`);
    }
    
    if (nlb.proxyNextUpstream) {
      lines.push(`    proxy_next_upstream on;`);
      if (nlb.proxyNextUpstreamTimeout > 0) {
        lines.push(`    proxy_next_upstream_timeout ${nlb.proxyNextUpstreamTimeout}s;`);
      }
      if (nlb.proxyNextUpstreamTries > 0) {
        lines.push(`    proxy_next_upstream_tries ${nlb.proxyNextUpstreamTries};`);
      }
    }
    
    lines.push(`}`);

    return lines.join('\n');
  }

  /**
   * Get algorithm directive for Nginx
   */
  private getAlgorithmDirective(algorithm: string): string {
    switch (algorithm) {
      case 'least_conn':
        return 'least_conn;';
      case 'ip_hash':
        return 'hash $remote_addr consistent;';
      case 'hash':
        return 'hash $remote_addr;';
      default:
        return ''; // round_robin is default
    }
  }

  /**
   * Enable stream configuration (create symlink)
   * Tương tự ln -s /etc/nginx/streams-available/xxx.conf /etc/nginx/streams-enabled/xxx.conf
   */
  private async enableStreamConfig(name: string): Promise<void> {
    const availablePath = path.join(this.streamsAvailablePath, `${name}.conf`);
    const enabledPath = path.join(this.streamsEnabledPath, `${name}.conf`);

    try {
      // Remove existing symlink if exists
      try {
        await fs.unlink(enabledPath);
      } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
      }

      // Create symlink
      await fs.symlink(availablePath, enabledPath);
      logger.info(`Stream configuration enabled for NLB: ${name}`);
    } catch (error) {
      logger.error(`Failed to enable stream config for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Disable stream configuration (remove symlink)
   */
  private async disableStreamConfig(name: string): Promise<void> {
    const enabledPath = path.join(this.streamsEnabledPath, `${name}.conf`);
    
    try {
      await fs.unlink(enabledPath);
      logger.info(`Stream configuration disabled for NLB: ${name}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to disable stream config for ${name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Remove stream configuration file permanently
   */
  private async removeStreamConfig(name: string): Promise<void> {
    const availablePath = path.join(this.streamsAvailablePath, `${name}.conf`);
    
    try {
      await fs.unlink(availablePath);
      logger.info(`Stream configuration removed for NLB: ${name}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to remove stream config for ${name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Ensure stream directories exist
   * Tạo các thư mục streams-available và streams-enabled nếu chưa có
   */
  private async ensureStreamInclude(): Promise<void> {
    try {
      // Ensure directories exist
      await fs.mkdir(this.streamsAvailablePath, { recursive: true });
      await fs.mkdir(this.streamsEnabledPath, { recursive: true });
      
      logger.info('Stream directories ensured');
    } catch (error) {
      logger.error('Failed to ensure stream directories:', error);
      throw new AppError('Failed to create stream directories', 500);
    }
  }

  /**
   * Test Nginx configuration
   */
  private async testNginxConfig(): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync('nginx -t 2>&1');
      logger.info('Nginx config test output:', stdout);

      if (stderr && !stdout.includes('syntax is ok')) {
        throw new Error(`Nginx config test failed: ${stderr}`);
      }
    } catch (error: any) {
      logger.error('Nginx configuration test failed:', error);
      throw new AppError(`Nginx configuration test failed: ${error.message}`, 500);
    }
  }

  /**
   * Reload Nginx configuration
   */
  private async reloadNginx(): Promise<void> {
    try {
      // Reload Nginx
      await execAsync('nginx -s reload');
      logger.info('Nginx reloaded successfully');
    } catch (error: any) {
      logger.error('Failed to reload Nginx:', error);
      throw new AppError(`Failed to reload Nginx: ${error.message}`, 500);
    }
  }

  /**
   * Perform health check on all upstreams of an NLB
   */
  async performHealthCheck(id: string): Promise<HealthCheckResult[]> {
    const nlb = await this.getNLBById(id);

    if (!nlb.healthCheckEnabled) {
      return [];
    }

    const results: HealthCheckResult[] = [];

    for (const upstream of nlb.upstreams) {
      const startTime = Date.now();
      let status: 'up' | 'down' | 'checking' = 'checking';
      let error: string | undefined;
      let responseTime: number | undefined;

      try {
        // Simple TCP connection check
        const net = require('net');
        await new Promise<void>((resolve, reject) => {
          const socket = net.createConnection(
            { host: upstream.host, port: upstream.port, timeout: nlb.healthCheckTimeout * 1000 },
            () => {
              socket.end();
              resolve();
            }
          );
          socket.on('error', reject);
          socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('Connection timeout'));
          });
        });

        status = 'up';
        responseTime = Date.now() - startTime;
      } catch (err: any) {
        status = 'down';
        error = err.message;
      }

      // Update upstream status
      await this.repository.updateUpstreamStatus(upstream.id, status, responseTime, error);

      // Create health check record
      await this.repository.createHealthCheck(
        nlb.id,
        upstream.host,
        upstream.port,
        status,
        responseTime,
        error
      );

      results.push({
        upstreamHost: upstream.host,
        upstreamPort: upstream.port,
        status,
        responseTime,
        error,
      });
    }

    return results;
  }
}

export const nlbService = new NLBService();

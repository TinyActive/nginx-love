import crypto from 'crypto';
import logger from '../../utils/logger';
import { ClusterRepository } from './cluster.repository';
import {
  SlaveNode,
  SlaveNodeResponse,
  SlaveNodeCreationResponse,
  HealthCheckData
} from './cluster.types';
import { RegisterSlaveNodeDto, UpdateSlaveNodeDto } from './dto';

/**
 * Cluster Service
 * Business logic for slave node management
 */
export class ClusterService {
  private repository: ClusterRepository;

  constructor() {
    this.repository = new ClusterRepository();
  }

  /**
   * Generate random API key for slave authentication
   */
  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Register new slave node
   */
  async registerSlaveNode(
    dto: RegisterSlaveNodeDto,
    userId?: string
  ): Promise<SlaveNodeCreationResponse> {
    const { name, host, port = 3001, syncInterval = 60 } = dto;

    // Check if name already exists
    const existing = await this.repository.findByName(name);

    if (existing) {
      throw new Error('Slave node with this name already exists');
    }

    // Generate API key for slave authentication
    const apiKey = this.generateApiKey();

    const node = await this.repository.create({
      name,
      host,
      port,
      syncInterval,
      apiKey,
      syncEnabled: true,
      status: 'offline'
    });

    logger.info(`Slave node registered: ${name}`, {
      userId,
      host,
      port
    });

    return {
      id: node.id,
      name: node.name,
      host: node.host,
      port: node.port,
      apiKey: node.apiKey, // Return API key ONLY on creation
      status: node.status as 'online' | 'offline' | 'error'
    };
  }

  /**
   * Get all slave nodes
   */
  async getAllSlaveNodes(): Promise<SlaveNodeResponse[]> {
    return this.repository.findAll();
  }

  /**
   * Get single slave node
   */
  async getSlaveNodeById(id: string): Promise<SlaveNodeResponse> {
    const node = await this.repository.findById(id);

    if (!node) {
      throw new Error('Slave node not found');
    }

    return node;
  }

  /**
   * Update slave node
   */
  async updateSlaveNode(
    id: string,
    dto: UpdateSlaveNodeDto,
    userId?: string
  ): Promise<SlaveNodeResponse> {
    const node = await this.repository.findById(id);

    if (!node) {
      throw new Error('Slave node not found');
    }

    // TODO: Implement update logic when needed
    // For now, this is a placeholder

    logger.info(`Slave node updated: ${id}`, {
      userId,
      changes: dto
    });

    return node;
  }

  /**
   * Delete slave node
   */
  async deleteSlaveNode(id: string, userId?: string): Promise<void> {
    await this.repository.delete(id);

    logger.info(`Slave node deleted: ${id}`, {
      userId
    });
  }

  /**
   * Health check (called by master to verify slave is alive)
   */
  async healthCheck(slaveNodeId?: string, slaveNodeName?: string): Promise<HealthCheckData> {
    return {
      timestamp: new Date().toISOString(),
      nodeId: slaveNodeId,
      nodeName: slaveNodeName
    };
  }
}

// Singleton instance
export const clusterService = new ClusterService();

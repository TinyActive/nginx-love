import prisma from '../../config/database';
import { SystemConfig, NodeMode } from './system.types';
import { NotFoundError } from '../../shared/errors/app-error';

/**
 * System Config repository - Handles all Prisma database operations for system configuration
 */
export class SystemConfigRepository {
  /**
   * Get system configuration (creates default if not exists)
   */
  async getSystemConfig(): Promise<SystemConfig> {
    let config = await prisma.systemConfig.findFirst();

    // Create default config if not exists
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          nodeMode: 'master',
          masterApiEnabled: true,
          slaveApiEnabled: false,
        },
      });
    }

    return config as SystemConfig;
  }

  /**
   * Update node mode
   */
  async updateNodeMode(
    configId: string,
    nodeMode: NodeMode,
    resetSlaveConnection: boolean = false
  ): Promise<SystemConfig> {
    const updateData: any = {
      nodeMode,
      masterApiEnabled: nodeMode === 'master',
      slaveApiEnabled: nodeMode === 'slave',
    };

    // Reset slave connection if switching to master
    if (resetSlaveConnection) {
      updateData.masterHost = null;
      updateData.masterPort = null;
      updateData.masterApiKey = null;
      updateData.connected = false;
      updateData.connectionError = null;
      updateData.lastConnectedAt = null;
    }

    const config = await prisma.systemConfig.update({
      where: { id: configId },
      data: updateData,
    });

    return config as SystemConfig;
  }

  /**
   * Create system config with specified node mode
   */
  async createSystemConfig(nodeMode: NodeMode): Promise<SystemConfig> {
    const config = await prisma.systemConfig.create({
      data: {
        nodeMode,
        masterApiEnabled: nodeMode === 'master',
        slaveApiEnabled: nodeMode === 'slave',
      },
    });

    return config as SystemConfig;
  }

  /**
   * Update master connection settings
   */
  async updateMasterConnection(
    configId: string,
    masterHost: string,
    masterPort: number,
    masterApiKey: string,
    connected: boolean,
    connectionError?: string | null
  ): Promise<SystemConfig> {
    const config = await prisma.systemConfig.update({
      where: { id: configId },
      data: {
        masterHost,
        masterPort,
        masterApiKey,
        connected,
        connectionError: connectionError || null,
        ...(connected && { lastConnectedAt: new Date() }),
      },
    });

    return config as SystemConfig;
  }

  /**
   * Disconnect from master
   */
  async disconnectFromMaster(configId: string): Promise<SystemConfig> {
    const config = await prisma.systemConfig.update({
      where: { id: configId },
      data: {
        masterHost: null,
        masterPort: null,
        masterApiKey: null,
        connected: false,
        lastConnectedAt: null,
        connectionError: null,
      },
    });

    return config as SystemConfig;
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(
    configId: string,
    connected: boolean,
    connectionError?: string | null
  ): Promise<SystemConfig> {
    const config = await prisma.systemConfig.update({
      where: { id: configId },
      data: {
        connected,
        connectionError: connectionError || null,
        ...(connected && { lastConnectedAt: new Date() }),
      },
    });

    return config as SystemConfig;
  }

  /**
   * Update last sync hash
   */
  async updateLastSyncHash(configId: string, lastSyncHash: string): Promise<SystemConfig> {
    const config = await prisma.systemConfig.update({
      where: { id: configId },
      data: {
        lastSyncHash,
        lastConnectedAt: new Date(),
      },
    });

    return config as SystemConfig;
  }

  /**
   * Find system config by ID
   */
  async findById(configId: string): Promise<SystemConfig | null> {
    const config = await prisma.systemConfig.findUnique({
      where: { id: configId },
    });

    return config as SystemConfig | null;
  }
}

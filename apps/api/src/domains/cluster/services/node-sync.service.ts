import crypto from 'crypto';
import logger from '../../../utils/logger';
import { ClusterRepository } from '../cluster.repository';
import { SyncConfigData, ImportResults } from '../cluster.types';

/**
 * Node Sync Service
 * Handles configuration synchronization between master and slave nodes
 */
export class NodeSyncService {
  private repository: ClusterRepository;

  constructor() {
    this.repository = new ClusterRepository();
  }

  /**
   * Export configuration for slave sync (NO timestamps to keep hash stable)
   */
  async exportForSync(slaveNodeId?: string): Promise<{ hash: string; config: SyncConfigData }> {
    try {
      logger.info('[NODE-SYNC] Exporting config for slave sync', {
        slaveNodeId
      });

      // Collect data WITHOUT timestamps/IDs that change
      const syncData = await this.repository.collectSyncData();

      // Calculate hash for comparison
      const dataString = JSON.stringify(syncData);
      const hash = crypto.createHash('sha256').update(dataString).digest('hex');

      // Update slave node's config hash (master knows what config slave should have)
      if (slaveNodeId) {
        await this.repository.updateConfigHash(slaveNodeId, hash);
      }

      return {
        hash,
        config: syncData
      };
    } catch (error) {
      logger.error('[NODE-SYNC] Export for sync error:', error);
      throw error;
    }
  }

  /**
   * Import configuration from master (slave imports synced config)
   */
  async importFromMaster(hash: string, config: SyncConfigData): Promise<{
    imported: boolean;
    hash: string;
    changes: number;
    details?: ImportResults;
  }> {
    try {
      // Get current config hash
      const currentConfig = await this.repository.collectSyncData();
      const currentHash = crypto.createHash('sha256').update(JSON.stringify(currentConfig)).digest('hex');

      logger.info('[NODE-SYNC] Import check', {
        currentHash,
        newHash: hash,
        needsImport: currentHash !== hash
      });

      // If hash is same, skip import
      if (currentHash === hash) {
        return {
          imported: false,
          hash: currentHash,
          changes: 0
        };
      }

      // Hash different → Import config
      logger.info('[NODE-SYNC] Hash mismatch, importing config...');
      const results = await this.repository.importSyncConfig(config);

      // Update SystemConfig with new connection timestamp
      await this.repository.updateSystemConfigLastConnected();

      logger.info('[NODE-SYNC] Import completed', results);

      return {
        imported: true,
        hash,
        changes: results.totalChanges,
        details: results
      };
    } catch (error: any) {
      logger.error('[NODE-SYNC] Import error:', error);
      throw error;
    }
  }

  /**
   * Get current config hash of slave node
   */
  async getCurrentConfigHash(): Promise<string> {
    try {
      const currentConfig = await this.repository.collectSyncData();
      const configString = JSON.stringify(currentConfig);
      const hash = crypto.createHash('sha256').update(configString).digest('hex');

      logger.info('[NODE-SYNC] Current config hash calculated', { hash });

      return hash;
    } catch (error: any) {
      logger.error('[NODE-SYNC] Get current hash error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const nodeSyncService = new NodeSyncService();

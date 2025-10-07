import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { SlaveRequest } from './cluster.types';
import { nodeSyncService } from './services/node-sync.service';
import logger from '../../utils/logger';

/**
 * Export configuration for slave sync (NO timestamps to keep hash stable)
 * This is DIFFERENT from backup export - optimized for sync with hash comparison
 */
export const exportForSync = async (req: SlaveRequest, res: Response): Promise<any> => {
  try {
    logger.info('[NODE-SYNC] Exporting config for slave sync', {
      slaveNode: req.slaveNode?.name
    });

    const result = await nodeSyncService.exportForSync(req.slaveNode?.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[NODE-SYNC] Export for sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Export for sync failed'
    });
  }
};

/**
 * Import configuration from master (slave imports synced config)
 */
export const importFromMaster = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { hash, config } = req.body;

    if (!hash || !config) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sync data: hash and config required'
      });
    }

    const result = await nodeSyncService.importFromMaster(hash, config);

    const message = result.imported
      ? 'Configuration imported successfully'
      : 'Configuration already up to date (hash match)';

    res.json({
      success: true,
      message,
      data: result
    });
  } catch (error: any) {
    logger.error('[NODE-SYNC] Import error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Import failed'
    });
  }
};

/**
 * Get current config hash of slave node
 */
export const getCurrentConfigHash = async (req: AuthRequest, res: Response) => {
  try {
    const hash = await nodeSyncService.getCurrentConfigHash();

    res.json({
      success: true,
      data: { hash }
    });
  } catch (error: any) {
    logger.error('[NODE-SYNC] Get current hash error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate current config hash'
    });
  }
};

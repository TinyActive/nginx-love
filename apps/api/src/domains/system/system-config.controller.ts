import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { SystemConfigService } from './system-config.service';
import { ResponseUtil } from '../../shared/utils/response.util';
import { ValidationError, NotFoundError } from '../../shared/errors/app-error';

const systemConfigService = new SystemConfigService();

/**
 * Get system configuration
 */
export const getSystemConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await systemConfigService.getSystemConfig();
    ResponseUtil.success(res, config);
  } catch (error) {
    logger.error('Get system config error:', error);
    ResponseUtil.error(res, 'Failed to get system configuration', 500);
  }
};

/**
 * Update node mode
 */
export const updateNodeMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nodeMode } = req.body;

    const config = await systemConfigService.updateNodeMode(nodeMode);

    logger.info(`Node mode changed to: ${nodeMode}`, {
      userId: req.user?.userId,
      configId: config.id,
    });

    ResponseUtil.success(res, config, `Node mode changed to ${nodeMode}`);
  } catch (error: any) {
    logger.error('Update node mode error:', error);

    if (error instanceof ValidationError) {
      ResponseUtil.error(res, error.message, 400);
      return;
    }

    ResponseUtil.error(res, 'Failed to update node mode', 500);
  }
};

/**
 * Connect to master node
 */
export const connectToMaster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { masterHost, masterPort, masterApiKey } = req.body;

    const config = await systemConfigService.connectToMaster(
      masterHost,
      masterPort,
      masterApiKey
    );

    logger.info('Successfully connected to master', {
      userId: req.user?.userId,
      masterHost,
      masterPort,
    });

    ResponseUtil.success(res, config, 'Successfully connected to master node');
  } catch (error: any) {
    logger.error('Connect to master error:', error);

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      // If it's a connection error, still return the config with error details
      if (error.message.includes('Failed to connect')) {
        try {
          const config = await systemConfigService.getSystemConfig();
          res.status(400).json({
            success: false,
            message: error.message,
            data: config,
          });
          return;
        } catch {
          // If can't get config, just return error
        }
      }
      ResponseUtil.error(res, error.message, 400);
      return;
    }

    ResponseUtil.error(res, error.message || 'Failed to connect to master', 500);
  }
};

/**
 * Disconnect from master node
 */
export const disconnectFromMaster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await systemConfigService.disconnectFromMaster();

    logger.info('Disconnected from master', {
      userId: req.user?.userId,
    });

    ResponseUtil.success(res, config, 'Disconnected from master node');
  } catch (error: any) {
    logger.error('Disconnect from master error:', error);

    if (error instanceof NotFoundError) {
      ResponseUtil.error(res, error.message, 400);
      return;
    }

    ResponseUtil.error(res, 'Failed to disconnect from master', 500);
  }
};

/**
 * Test connection to master
 */
export const testMasterConnection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await systemConfigService.testMasterConnection();

    res.json({
      success: true,
      message: 'Connection to master successful',
      data: result,
    });
  } catch (error: any) {
    logger.error('Test master connection error:', error);

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      ResponseUtil.error(res, error.message, 400);
      return;
    }

    ResponseUtil.error(
      res,
      error.response?.data?.message || error.message || 'Connection test failed',
      400
    );
  }
};

/**
 * Sync configuration from master
 */
export const syncWithMaster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Extract JWT token from request
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.substring(7) : ''; // Remove 'Bearer '

    const result = await systemConfigService.syncWithMaster(token);

    res.json({
      success: true,
      message: result.imported
        ? 'Configuration synchronized successfully'
        : 'Configuration already synchronized (no changes detected)',
      data: result,
    });
  } catch (error: any) {
    logger.error('Sync with master error:', error);

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      ResponseUtil.error(
        res,
        error.message,
        400
      );
      return;
    }

    ResponseUtil.error(
      res,
      error.response?.data?.message || error.message || 'Sync failed',
      500
    );
  }
};

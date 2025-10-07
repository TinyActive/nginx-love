import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { SystemService } from './system.service';

const systemService = new SystemService();

/**
 * Get installation status
 */
export const getInstallationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await systemService.getInstallationStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Get installation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get installation status',
    });
  }
};

/**
 * Get nginx status
 */
export const getNginxStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await systemService.getNginxStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Get nginx status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nginx status',
    });
  }
};

/**
 * Start installation
 */
export const startInstallation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await systemService.startInstallation(req.user!.role, req.user!.username);

    res.json({
      success: true,
      message: 'Installation started in background',
    });
  } catch (error: any) {
    logger.error('Start installation error:', error);

    if (error.message === 'Only admins can start installation') {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === 'Nginx is already installed') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to start installation',
    });
  }
};

/**
 * Get current system metrics
 */
export const getSystemMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await systemService.getSystemMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get system metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Manually trigger alert monitoring check
 */
export const triggerAlertCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await systemService.triggerAlertCheck(req.user!.username);

    res.json({
      success: true,
      message: 'Alert monitoring check triggered successfully. Check logs for details.'
    });
  } catch (error: any) {
    logger.error('Trigger alert check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { SlaveRequest } from './cluster.types';
import { clusterService } from './cluster.service';
import logger from '../../utils/logger';

/**
 * Register new slave node
 */
export const registerSlaveNode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, host, port, syncInterval } = req.body;

    const result = await clusterService.registerSlaveNode(
      { name, host, port, syncInterval },
      req.user?.userId
    );

    res.status(201).json({
      success: true,
      message: 'Slave node registered successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Register slave node error:', error);
    res.status(error.message === 'Slave node with this name already exists' ? 400 : 500).json({
      success: false,
      message: error.message || 'Failed to register slave node'
    });
  }
};

/**
 * Get all slave nodes
 */
export const getSlaveNodes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const nodes = await clusterService.getAllSlaveNodes();

    res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    logger.error('Get slave nodes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slave nodes'
    });
  }
};

/**
 * Get single slave node
 */
export const getSlaveNode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const node = await clusterService.getSlaveNodeById(id);

    res.json({
      success: true,
      data: node
    });
  } catch (error: any) {
    logger.error('Get slave node error:', error);
    res.status(error.message === 'Slave node not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to get slave node'
    });
  }
};

/**
 * Delete slave node
 */
export const deleteSlaveNode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await clusterService.deleteSlaveNode(id, req.user?.userId);

    res.json({
      success: true,
      message: 'Slave node deleted successfully'
    });
  } catch (error) {
    logger.error('Delete slave node error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete slave node'
    });
  }
};

/**
 * Health check endpoint (called by master to verify slave is alive)
 */
export const healthCheck = async (req: SlaveRequest, res: Response): Promise<void> => {
  try {
    const data = await clusterService.healthCheck(
      req.slaveNode?.id,
      req.slaveNode?.name
    );

    res.json({
      success: true,
      message: 'Slave node is healthy',
      data
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed'
    });
  }
};

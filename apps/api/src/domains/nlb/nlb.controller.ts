import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { nlbService } from './nlb.service';
import { NLBQueryOptions } from './nlb.types';

/**
 * Controller for Network Load Balancer operations
 */
export class NLBController {
  /**
   * Get all NLBs with search and pagination
   */
  async getNLBs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        protocol = '',
        enabled = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const options: NLBQueryOptions = {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        filters: {
          search: search as string,
          status: status as string,
          protocol: protocol as string,
          enabled: enabled as string,
        },
      };

      const result = await nlbService.getAllNLBs(options);

      res.json({
        success: true,
        data: result.nlbs,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Get NLBs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get NLB by ID
   */
  async getNLBById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as Record<string, string>;
      const nlb = await nlbService.getNLBById(id);

      res.json({
        success: true,
        data: nlb,
      });
    } catch (error: any) {
      logger.error('Get NLB by ID error:', error);
      
      if (error.statusCode === 404) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Create new NLB
   */
  async createNLB(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const nlb = await nlbService.createNLB(req.body);

      res.status(201).json({
        success: true,
        data: nlb,
        message: 'NLB created successfully',
      });
    } catch (error: any) {
      logger.error('Create NLB error:', error);

      if (error.statusCode === 400 || error.statusCode === 409) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create NLB',
      });
    }
  }

  /**
   * Update NLB
   */
  async updateNLB(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params as Record<string, string>;
      const nlb = await nlbService.updateNLB(id, req.body);

      res.json({
        success: true,
        data: nlb,
        message: 'NLB updated successfully',
      });
    } catch (error: any) {
      logger.error('Update NLB error:', error);

      if (error.statusCode === 404) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.statusCode === 400 || error.statusCode === 409) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update NLB',
      });
    }
  }

  /**
   * Delete NLB
   */
  async deleteNLB(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as Record<string, string>;
      await nlbService.deleteNLB(id);

      res.json({
        success: true,
        message: 'NLB deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete NLB error:', error);

      if (error.statusCode === 404) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete NLB',
      });
    }
  }

  /**
   * Toggle NLB enabled status
   */
  async toggleNLB(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params as Record<string, string>;
      const { enabled } = req.body;

      const nlb = await nlbService.toggleNLB(id, enabled);

      res.json({
        success: true,
        data: nlb,
        message: `NLB ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error: any) {
      logger.error('Toggle NLB error:', error);

      if (error.statusCode === 404) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to toggle NLB',
      });
    }
  }

  /**
   * Perform health check on NLB upstreams
   */
  async performHealthCheck(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as Record<string, string>;
      const results = await nlbService.performHealthCheck(id);

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('Perform health check error:', error);

      if (error.statusCode === 404) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to perform health check',
      });
    }
  }

  /**
   * Get NLB statistics
   */
  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await nlbService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get NLB stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const nlbController = new NLBController();

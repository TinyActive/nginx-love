import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { domainsService } from './domains.service';
import { DomainQueryOptions } from './domains.types';

/**
 * Controller for domain operations
 */
export class DomainsController {
  /**
   * Get all domains with search and pagination
   */
  async getDomains(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        sslEnabled = '',
        modsecEnabled = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const options: DomainQueryOptions = {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        filters: {
          search: search as string,
          status: status as string,
          sslEnabled: sslEnabled as string,
          modsecEnabled: modsecEnabled as string,
        },
      };

      const result = await domainsService.getDomains(options);

      res.json({
        success: true,
        data: result.domains,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Get domains error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get domain by ID
   */
  async getDomainById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const domain = await domainsService.getDomainById(id);

      if (!domain) {
        res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
        return;
      }

      res.json({
        success: true,
        data: domain,
      });
    } catch (error) {
      logger.error('Get domain by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Create new domain
   */
  async createDomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { name, upstreams, loadBalancer, modsecEnabled } = req.body;

      const domain = await domainsService.createDomain(
        {
          name,
          upstreams,
          loadBalancer,
          modsecEnabled,
        },
        req.user!.userId,
        req.user!.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.status(201).json({
        success: true,
        message: 'Domain created successfully',
        data: domain,
      });
    } catch (error: any) {
      logger.error('Create domain error:', error);

      if (error.message === 'Domain already exists') {
        res.status(400).json({
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
   * Update domain
   */
  async updateDomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { name, status, modsecEnabled, upstreams, loadBalancer } = req.body;

      const domain = await domainsService.updateDomain(
        id,
        {
          name,
          status,
          modsecEnabled,
          upstreams,
          loadBalancer,
        },
        req.user!.userId,
        req.user!.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        message: 'Domain updated successfully',
        data: domain,
      });
    } catch (error: any) {
      logger.error('Update domain error:', error);

      if (error.message === 'Domain not found') {
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
   * Delete domain
   */
  async deleteDomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await domainsService.deleteDomain(
        id,
        req.user!.userId,
        req.user!.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        message: 'Domain deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete domain error:', error);

      if (error.message === 'Domain not found') {
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
   * Toggle SSL for domain (Enable/Disable SSL)
   */
  async toggleSSL(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sslEnabled } = req.body;

      if (typeof sslEnabled !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'sslEnabled must be a boolean value',
        });
        return;
      }

      const domain = await domainsService.toggleSSL(
        id,
        sslEnabled,
        req.user!.userId,
        req.user!.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        message: `SSL ${sslEnabled ? 'enabled' : 'disabled'} successfully`,
        data: domain,
      });
    } catch (error: any) {
      logger.error('Toggle SSL error:', error);

      if (error.message === 'Domain not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes('Cannot enable SSL')) {
        res.status(400).json({
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
   * Reload nginx configuration with smart retry logic
   */
  async reloadNginx(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await domainsService.reloadNginx(
        req.user!.userId,
        req.user!.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to reload nginx',
        });
        return;
      }

      res.json({
        success: true,
        message: `Nginx ${
          result.method === 'restart' ? 'restarted' : 'reloaded'
        } successfully`,
        method: result.method,
        mode: result.mode,
      });
    } catch (error: any) {
      logger.error('Reload nginx error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reload nginx',
      });
    }
  }
}

// Export singleton instance
export const domainsController = new DomainsController();

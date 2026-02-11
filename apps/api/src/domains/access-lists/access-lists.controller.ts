import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { accessListsService } from './access-lists.service';
import logger from '../../utils/logger';
import { AccessListQueryOptions } from './access-lists.types';

/**
 * Controller for Access Lists endpoints
 */
export class AccessListsController {
  /**
   * Get all access lists
   */
  async getAccessLists(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const options: AccessListQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        type: req.query.type as any,
        enabled: req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined,
      };

      const result = await accessListsService.getAccessLists(options);

      res.json({
        success: true,
        data: result.accessLists,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Failed to get access lists', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get access lists',
      });
    }
  }

  /**
   * Get single access list by ID
   */
  async getAccessList(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params as Record<string, string>;

      const accessList = await accessListsService.getAccessListById(id);

      if (!accessList) {
        return res.status(404).json({
          success: false,
          message: 'Access list not found',
        });
      }

      res.json({
        success: true,
        data: accessList,
      });
    } catch (error: any) {
      logger.error('Failed to get access list', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get access list',
      });
    }
  }

  /**
   * Create new access list
   */
  async createAccessList(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userId = (req as any).user.id;
      const username = (req as any).user.username;
      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const accessList = await accessListsService.createAccessList(
        req.body,
        userId,
        username,
        ip,
        userAgent
      );

      res.status(201).json({
        success: true,
        message: 'Access list created successfully',
        data: accessList,
      });
    } catch (error: any) {
      logger.error('Failed to create access list', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create access list',
      });
    }
  }

  /**
   * Update access list
   */
  async updateAccessList(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params as Record<string, string>;
      const userId = (req as any).user.id;
      const username = (req as any).user.username;
      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const accessList = await accessListsService.updateAccessList(
        id,
        req.body,
        userId,
        username,
        ip,
        userAgent
      );

      res.json({
        success: true,
        message: 'Access list updated successfully',
        data: accessList,
      });
    } catch (error: any) {
      logger.error('Failed to update access list', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update access list',
      });
    }
  }

  /**
   * Delete access list
   */
  async deleteAccessList(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params as Record<string, string>;
      const userId = (req as any).user.id;
      const username = (req as any).user.username;
      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      await accessListsService.deleteAccessList(id, userId, username, ip, userAgent);

      res.json({
        success: true,
        message: 'Access list deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete access list', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete access list',
      });
    }
  }

  /**
   * Toggle access list enabled status
   */
  async toggleAccessList(req: Request, res: Response) {
    try {
      const { id } = req.params as Record<string, string>;
      const { enabled } = req.body;
      const userId = (req as any).user.id;
      const username = (req as any).user.username;
      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const accessList = await accessListsService.toggleAccessList(
        id,
        enabled,
        userId,
        username,
        ip,
        userAgent
      );

      res.json({
        success: true,
        message: `Access list ${enabled ? 'enabled' : 'disabled'} successfully`,
        data: accessList,
      });
    } catch (error: any) {
      logger.error('Failed to toggle access list', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle access list',
      });
    }
  }

  /**
   * Apply access list to domain
   */
  async applyToDomain(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userId = (req as any).user.id;
      const username = (req as any).user.username;
      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await accessListsService.applyToDomain(
        req.body,
        userId,
        username,
        ip,
        userAgent
      );

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Failed to apply access list to domain', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to apply access list to domain',
      });
    }
  }

  /**
   * Remove access list from domain
   */
  async removeFromDomain(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { accessListId, domainId } = req.params as Record<string, string>;
      const userId = (req as any).user.id;
      const username = (req as any).user.username;
      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await accessListsService.removeFromDomain(
        accessListId,
        domainId,
        userId,
        username,
        ip,
        userAgent
      );

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Failed to remove access list from domain', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove access list from domain',
      });
    }
  }

  /**
   * Get access lists by domain
   */
  async getByDomain(req: Request, res: Response) {
    try {
      const { domainId } = req.params as Record<string, string>;

      const accessLists = await accessListsService.getAccessListsByDomainId(domainId);

      res.json({
        success: true,
        data: accessLists,
      });
    } catch (error: any) {
      logger.error('Failed to get access lists by domain', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get access lists by domain',
      });
    }
  }

  /**
   * Get statistics
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await accessListsService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get access lists stats', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get access lists stats',
      });
    }
  }
}

export const accessListsController = new AccessListsController();

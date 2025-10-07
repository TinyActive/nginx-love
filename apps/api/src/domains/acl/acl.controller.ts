import { Request, Response } from 'express';
import { aclService } from './acl.service';
import { CreateAclRuleDto, UpdateAclRuleDto, validateCreateAclRuleDto, validateUpdateAclRuleDto } from './dto';
import logger from '../../utils/logger';

/**
 * ACL Controller
 * Handles HTTP requests for ACL operations
 */
export class AclController {
  /**
   * Get all ACL rules
   * @route GET /api/acl
   */
  async getAclRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await aclService.getAllRules();

      res.json({
        success: true,
        data: rules
      });
    } catch (error: any) {
      logger.error('Failed to fetch ACL rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ACL rules',
        error: error.message
      });
    }
  }

  /**
   * Get single ACL rule by ID
   * @route GET /api/acl/:id
   */
  async getAclRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rule = await aclService.getRuleById(id);

      res.json({
        success: true,
        data: rule
      });
    } catch (error: any) {
      logger.error('Failed to fetch ACL rule:', error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch ACL rule',
        ...(statusCode === 500 && { error: error.message })
      });
    }
  }

  /**
   * Create new ACL rule
   * @route POST /api/acl
   */
  async createAclRule(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateAclRuleDto = req.body;

      // Validate DTO
      const validation = validateCreateAclRuleDto(dto);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: validation.errors
        });
        return;
      }

      const rule = await aclService.createRule(dto);

      res.status(201).json({
        success: true,
        message: 'ACL rule created successfully',
        data: rule
      });
    } catch (error: any) {
      logger.error('Failed to create ACL rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create ACL rule',
        error: error.message
      });
    }
  }

  /**
   * Update ACL rule
   * @route PUT /api/acl/:id
   */
  async updateAclRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateAclRuleDto = req.body;

      // Validate DTO
      const validation = validateUpdateAclRuleDto(dto);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid update data',
          errors: validation.errors
        });
        return;
      }

      const rule = await aclService.updateRule(id, dto);

      res.json({
        success: true,
        message: 'ACL rule updated successfully',
        data: rule
      });
    } catch (error: any) {
      logger.error('Failed to update ACL rule:', error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update ACL rule',
        ...(statusCode === 500 && { error: error.message })
      });
    }
  }

  /**
   * Delete ACL rule
   * @route DELETE /api/acl/:id
   */
  async deleteAclRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await aclService.deleteRule(id);

      res.json({
        success: true,
        message: 'ACL rule deleted successfully'
      });
    } catch (error: any) {
      logger.error('Failed to delete ACL rule:', error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete ACL rule',
        ...(statusCode === 500 && { error: error.message })
      });
    }
  }

  /**
   * Toggle ACL rule enabled status
   * @route PATCH /api/acl/:id/toggle
   */
  async toggleAclRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rule = await aclService.toggleRule(id);

      res.json({
        success: true,
        message: `ACL rule ${rule.enabled ? 'enabled' : 'disabled'} successfully`,
        data: rule
      });
    } catch (error: any) {
      logger.error('Failed to toggle ACL rule:', error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to toggle ACL rule',
        ...(statusCode === 500 && { error: error.message })
      });
    }
  }

  /**
   * Apply ACL rules to Nginx
   * @route POST /api/acl/apply
   */
  async applyAclToNginx(req: Request, res: Response): Promise<void> {
    try {
      const result = await aclService.applyRulesToNginx();

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error: any) {
      logger.error('Failed to apply ACL rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply ACL rules',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const aclController = new AclController();

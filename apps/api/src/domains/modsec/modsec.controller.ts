import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { modSecService } from './modsec.service';
import { AddCustomRuleDto, UpdateModSecRuleDto, ToggleCRSRuleDto, SetGlobalModSecDto } from './dto';

/**
 * ModSecurity controller
 * Handles HTTP requests/responses for ModSecurity management
 */
export class ModSecController {
  /**
   * Get all CRS (OWASP Core Rule Set) rules
   */
  async getCRSRules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { domainId } = req.query;

      const rules = await modSecService.getCRSRules(domainId as string | undefined);

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      logger.error('Get CRS rules error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Toggle CRS rule status
   */
  async toggleCRSRule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { ruleFile } = req.params;
      const { domainId } = req.body;

      const dto: ToggleCRSRuleDto = { domainId };

      const updatedRule = await modSecService.toggleCRSRule(ruleFile, dto);

      res.json({
        success: true,
        message: `Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} successfully`,
        data: updatedRule,
      });
    } catch (error: any) {
      if (error.message === 'CRS rule not found') {
        res.status(404).json({
          success: false,
          message: 'CRS rule not found',
        });
        return;
      }

      logger.error('Toggle CRS rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get all ModSecurity custom rules
   */
  async getModSecRules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { domainId } = req.query;

      const rules = await modSecService.getModSecRules(domainId as string | undefined);

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      logger.error('Get ModSec rules error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get single ModSecurity rule by ID
   */
  async getModSecRule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rule = await modSecService.getModSecRule(id);

      res.json({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      if (error.message === 'ModSecurity rule not found') {
        res.status(404).json({
          success: false,
          message: 'ModSecurity rule not found',
        });
        return;
      }

      logger.error('Get ModSec rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Toggle ModSecurity rule status
   */
  async toggleModSecRule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const updatedRule = await modSecService.toggleModSecRule(id);

      logger.info(`ModSecurity rule ${updatedRule.name} ${updatedRule.enabled ? 'enabled' : 'disabled'}`, {
        ruleId: id,
        userId: req.user?.userId,
      });

      res.json({
        success: true,
        message: `Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} successfully`,
        data: updatedRule,
      });
    } catch (error: any) {
      if (error.message === 'ModSecurity rule not found') {
        res.status(404).json({
          success: false,
          message: 'ModSecurity rule not found',
        });
        return;
      }

      logger.error('Toggle ModSec rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Add custom ModSecurity rule
   */
  async addCustomRule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { name, category, ruleContent, description, domainId, enabled = true } = req.body;

      const dto: AddCustomRuleDto = {
        name,
        category,
        ruleContent,
        description,
        domainId,
        enabled,
      };

      const rule = await modSecService.addCustomRule(dto);

      logger.info(`Custom ModSecurity rule added: ${rule.name}`, {
        ruleId: rule.id,
        userId: req.user?.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Custom rule added successfully',
        data: rule,
      });
    } catch (error: any) {
      if (error.message === 'Domain not found') {
        res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
        return;
      }

      logger.error('Add custom rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update ModSecurity rule
   */
  async updateModSecRule(req: AuthRequest, res: Response): Promise<void> {
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
      const { name, category, ruleContent, description, enabled } = req.body;

      const dto: UpdateModSecRuleDto = {
        name,
        category,
        ruleContent,
        description,
        enabled,
      };

      const updatedRule = await modSecService.updateModSecRule(id, dto);

      logger.info(`ModSecurity rule updated: ${updatedRule.name}`, {
        ruleId: id,
        userId: req.user?.userId,
      });

      res.json({
        success: true,
        message: 'Rule updated successfully',
        data: updatedRule,
      });
    } catch (error: any) {
      if (error.message === 'ModSecurity rule not found') {
        res.status(404).json({
          success: false,
          message: 'ModSecurity rule not found',
        });
        return;
      }

      logger.error('Update ModSec rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Delete ModSecurity rule
   */
  async deleteModSecRule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await modSecService.deleteModSecRule(id);

      logger.info(`ModSecurity rule deleted`, {
        ruleId: id,
        userId: req.user?.userId,
      });

      res.json({
        success: true,
        message: 'Rule deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'ModSecurity rule not found') {
        res.status(404).json({
          success: false,
          message: 'ModSecurity rule not found',
        });
        return;
      }

      logger.error('Delete ModSec rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get global ModSecurity settings
   */
  async getGlobalModSecSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const settings = await modSecService.getGlobalModSecSettings();

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Get global ModSec settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Set global ModSecurity enabled/disabled
   */
  async setGlobalModSec(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { enabled } = req.body;

      const dto: SetGlobalModSecDto = { enabled };

      const config = await modSecService.setGlobalModSec(dto);

      logger.info(`Global ModSecurity ${enabled ? 'enabled' : 'disabled'}`, {
        userId: req.user?.userId,
      });

      res.json({
        success: true,
        message: `ModSecurity globally ${enabled ? 'enabled' : 'disabled'}`,
        data: config,
      });
    } catch (error) {
      logger.error('Set global ModSec error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const modSecController = new ModSecController();

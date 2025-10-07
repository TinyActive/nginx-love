import logger from '../../utils/logger';
import { aclRepository } from './acl.repository';
import { aclNginxService } from './services/acl-nginx.service';
import { AclRuleEntity, CreateAclRuleData, UpdateAclRuleData, AclNginxResult } from './acl.types';
import { NotFoundError } from '../../shared/errors/app-error';

/**
 * ACL Service - Business logic layer
 * Handles ACL operations and orchestrates repository and Nginx service
 */
export class AclService {
  /**
   * Get all ACL rules
   */
  async getAllRules(): Promise<AclRuleEntity[]> {
    return aclRepository.findAll();
  }

  /**
   * Get single ACL rule by ID
   */
  async getRuleById(id: string): Promise<AclRuleEntity> {
    const rule = await aclRepository.findById(id);

    if (!rule) {
      throw new NotFoundError('ACL rule not found');
    }

    return rule;
  }

  /**
   * Create new ACL rule
   */
  async createRule(data: CreateAclRuleData): Promise<AclRuleEntity> {
    // Create the rule
    const rule = await aclRepository.create(data);

    logger.info(`ACL rule created: ${rule.name} (${rule.id})`);

    // Auto-apply ACL rules to Nginx
    await aclNginxService.applyAclRules();

    return rule;
  }

  /**
   * Update ACL rule
   */
  async updateRule(id: string, data: UpdateAclRuleData): Promise<AclRuleEntity> {
    // Check if rule exists
    const exists = await aclRepository.exists(id);
    if (!exists) {
      throw new NotFoundError('ACL rule not found');
    }

    // Update the rule
    const rule = await aclRepository.update(id, data);

    logger.info(`ACL rule updated: ${rule.name} (${rule.id})`);

    // Auto-apply ACL rules to Nginx
    await aclNginxService.applyAclRules();

    return rule;
  }

  /**
   * Delete ACL rule
   */
  async deleteRule(id: string): Promise<void> {
    // Check if rule exists
    const rule = await aclRepository.findById(id);
    if (!rule) {
      throw new NotFoundError('ACL rule not found');
    }

    // Delete the rule
    await aclRepository.delete(id);

    logger.info(`ACL rule deleted: ${rule.name} (${id})`);

    // Auto-apply ACL rules to Nginx
    await aclNginxService.applyAclRules();
  }

  /**
   * Toggle ACL rule enabled status
   */
  async toggleRule(id: string): Promise<AclRuleEntity> {
    // Check if rule exists
    const existingRule = await aclRepository.findById(id);
    if (!existingRule) {
      throw new NotFoundError('ACL rule not found');
    }

    // Toggle the rule
    const rule = await aclRepository.toggleEnabled(id, !existingRule.enabled);

    logger.info(`ACL rule toggled: ${rule.name} (${rule.id}) - enabled: ${rule.enabled}`);

    // Auto-apply ACL rules to Nginx
    await aclNginxService.applyAclRules();

    return rule;
  }

  /**
   * Apply ACL rules to Nginx
   */
  async applyRulesToNginx(): Promise<AclNginxResult> {
    logger.info('Manual ACL rules application triggered');
    return aclNginxService.applyAclRules();
  }

  /**
   * Initialize ACL configuration
   */
  async initializeConfig(): Promise<void> {
    return aclNginxService.initializeAclConfig();
  }
}

// Export singleton instance
export const aclService = new AclService();

import prisma from '../../config/database';
import { ModSecRule, ModSecRuleWithDomain, CRSRule, ModSecConfig } from './modsec.types';
import { AddCustomRuleDto, UpdateModSecRuleDto } from './dto';

/**
 * ModSecurity repository
 * Handles all database operations for ModSecurity rules
 */
export class ModSecRepository {
  /**
   * CRS Rules operations
   */

  async findCRSRules(domainId?: string) {
    return prisma.modSecCRSRule.findMany({
      where: domainId ? { domainId } : { domainId: null },
      orderBy: { category: 'asc' },
    });
  }

  async findCRSRuleByFile(ruleFile: string, domainId?: string) {
    return prisma.modSecCRSRule.findFirst({
      where: {
        ruleFile,
        domainId: domainId || null,
      },
    });
  }

  async createCRSRule(data: {
    ruleFile: string;
    name: string;
    category: string;
    description: string;
    enabled: boolean;
    paranoia: number;
    domainId?: string | null;
  }) {
    return prisma.modSecCRSRule.create({
      data,
    });
  }

  async updateCRSRule(id: string, enabled: boolean) {
    return prisma.modSecCRSRule.update({
      where: { id },
      data: { enabled },
    });
  }

  /**
   * Custom ModSec Rules operations
   */

  async findModSecRules(domainId?: string): Promise<ModSecRule[]> {
    if (domainId) {
      return prisma.modSecRule.findMany({
        where: { domainId },
        orderBy: { category: 'asc' },
      }) as Promise<ModSecRule[]>;
    } else {
      return prisma.modSecRule.findMany({
        where: { domainId: null },
        orderBy: { category: 'asc' },
      }) as Promise<ModSecRule[]>;
    }
  }

  async findModSecRuleById(id: string): Promise<ModSecRuleWithDomain | null> {
    return prisma.modSecRule.findUnique({
      where: { id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as Promise<ModSecRuleWithDomain | null>;
  }

  async createModSecRule(data: AddCustomRuleDto): Promise<ModSecRule> {
    return prisma.modSecRule.create({
      data: {
        name: data.name,
        category: data.category,
        ruleContent: data.ruleContent,
        description: data.description,
        domainId: data.domainId || null,
        enabled: data.enabled ?? true,
      },
    }) as Promise<ModSecRule>;
  }

  async updateModSecRule(id: string, data: UpdateModSecRuleDto): Promise<ModSecRule> {
    return prisma.modSecRule.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.ruleContent && { ruleContent: data.ruleContent }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    }) as Promise<ModSecRule>;
  }

  async deleteModSecRule(id: string): Promise<void> {
    await prisma.modSecRule.delete({
      where: { id },
    });
  }

  async toggleModSecRule(id: string, enabled: boolean): Promise<ModSecRule> {
    return prisma.modSecRule.update({
      where: { id },
      data: { enabled },
    }) as Promise<ModSecRule>;
  }

  /**
   * Domain operations
   */

  async findDomainById(domainId: string) {
    return prisma.domain.findUnique({
      where: { id: domainId },
    });
  }

  /**
   * Global ModSecurity configuration
   */

  async findGlobalModSecConfig(): Promise<ModSecConfig | null> {
    return prisma.nginxConfig.findFirst({
      where: {
        configType: 'modsecurity',
        name: 'global_settings',
      },
    }) as Promise<ModSecConfig | null>;
  }

  async updateGlobalModSecConfig(id: string, enabled: boolean): Promise<ModSecConfig> {
    return prisma.nginxConfig.update({
      where: { id },
      data: { enabled },
    }) as Promise<ModSecConfig>;
  }

  async createGlobalModSecConfig(enabled: boolean): Promise<ModSecConfig> {
    return prisma.nginxConfig.create({
      data: {
        configType: 'modsecurity',
        name: 'global_settings',
        content: `# ModSecurity Global Settings\nSecRuleEngine ${enabled ? 'On' : 'Off'}`,
        enabled,
      },
    }) as Promise<ModSecConfig>;
  }
}

export const modSecRepository = new ModSecRepository();

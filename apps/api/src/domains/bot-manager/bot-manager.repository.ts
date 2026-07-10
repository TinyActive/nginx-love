import prisma from '../../config/database';
import {
  BotProfileQueryOptions,
  BotRuleQueryOptions,
  CreateBotProfileInput,
  UpdateBotProfileInput,
  CreateBotRuleInput,
  UpdateBotRuleInput,
  BotProfileWithRelations,
  BotRuleEntity,
} from './bot-manager.types';
import { PaginationMeta } from '../../shared/types/common.types';

export class BotManagerRepository {
  async findAllProfiles(options: BotProfileQueryOptions = {}): Promise<{
    profiles: BotProfileWithRelations[];
    pagination: PaginationMeta;
  }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options.enabled !== undefined) where.enabled = options.enabled;
    if (options.policyMode) where.policyMode = options.policyMode;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [profiles, total] = await Promise.all([
      prisma.botProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          rules: { orderBy: { priority: 'asc' } },
          domains: {
            include: { domain: { select: { id: true, name: true, status: true } } },
          },
          _count: { select: { rules: true, domains: true } },
        },
      }),
      prisma.botProfile.count({ where }),
    ]);

    return {
      profiles: profiles as BotProfileWithRelations[],
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findProfileById(id: string): Promise<BotProfileWithRelations | null> {
    const profile = await prisma.botProfile.findUnique({
      where: { id },
      include: {
        rules: { orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] },
        domains: {
          include: { domain: { select: { id: true, name: true, status: true } } },
        },
      },
    });
    return profile as BotProfileWithRelations | null;
  }

  async findProfileByName(name: string): Promise<BotProfileWithRelations | null> {
    const profile = await prisma.botProfile.findUnique({
      where: { name },
      include: {
        rules: true,
        domains: {
          include: { domain: { select: { id: true, name: true, status: true } } },
        },
      },
    });
    return profile as BotProfileWithRelations | null;
  }

  async createProfile(data: CreateBotProfileInput): Promise<BotProfileWithRelations> {
    const profile = await prisma.botProfile.create({
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? true,
        policyMode: data.policyMode ?? 'blacklist',
      },
      include: {
        rules: true,
        domains: {
          include: { domain: { select: { id: true, name: true, status: true } } },
        },
      },
    });
    return profile as BotProfileWithRelations;
  }

  async updateProfile(id: string, data: UpdateBotProfileInput): Promise<BotProfileWithRelations> {
    await prisma.botProfile.update({ where: { id }, data });
    return (await this.findProfileById(id))!;
  }

  async deleteProfile(id: string): Promise<void> {
    await prisma.botProfile.delete({ where: { id } });
  }

  async toggleProfile(id: string, enabled: boolean): Promise<BotProfileWithRelations> {
    return this.updateProfile(id, { enabled });
  }

  async findRules(options: BotRuleQueryOptions = {}): Promise<{
    rules: BotRuleEntity[];
    pagination: PaginationMeta;
  }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options.profileId !== undefined) where.profileId = options.profileId;
    if (options.fingerprintType) where.fingerprintType = options.fingerprintType;
    if (options.action) where.action = options.action;
    if (options.enabled !== undefined) where.enabled = options.enabled;
    if (options.isBuiltin !== undefined) where.isBuiltin = options.isBuiltin;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { fingerprint: { contains: options.search, mode: 'insensitive' } },
        { clientLabel: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [rules, total] = await Promise.all([
      prisma.botRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.botRule.count({ where }),
    ]);

    return {
      rules,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findRuleById(id: string): Promise<BotRuleEntity | null> {
    return prisma.botRule.findUnique({ where: { id } });
  }

  async findGlobalRules(enabledOnly = false): Promise<BotRuleEntity[]> {
    return prisma.botRule.findMany({
      where: {
        profileId: null,
        ...(enabledOnly ? { enabled: true } : {}),
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createRule(data: CreateBotRuleInput): Promise<BotRuleEntity> {
    return prisma.botRule.create({
      data: {
        name: data.name,
        fingerprintType: data.fingerprintType,
        fingerprint: data.fingerprint,
        action: data.action,
        enabled: data.enabled ?? true,
        priority: data.priority ?? 100,
        notes: data.notes,
        clientLabel: data.clientLabel,
        profileId: data.profileId ?? null,
      },
    });
  }

  async updateRule(id: string, data: UpdateBotRuleInput): Promise<BotRuleEntity> {
    return prisma.botRule.update({ where: { id }, data });
  }

  async deleteRule(id: string): Promise<void> {
    await prisma.botRule.delete({ where: { id } });
  }

  async toggleRule(id: string, enabled: boolean): Promise<BotRuleEntity> {
    return prisma.botRule.update({ where: { id }, data: { enabled } });
  }

  async assignProfileToDomain(
    profileId: string,
    domainId: string,
    enabled = true
  ): Promise<void> {
    await prisma.botProfileDomain.upsert({
      where: { profileId_domainId: { profileId, domainId } },
      create: { profileId, domainId, enabled },
      update: { enabled },
    });
  }

  async removeProfileFromDomain(profileId: string, domainId: string): Promise<void> {
    await prisma.botProfileDomain.delete({
      where: { profileId_domainId: { profileId, domainId } },
    });
  }

  async findProfilesByDomainId(domainId: string) {
    return prisma.botProfileDomain.findMany({
      where: { domainId, enabled: true },
      include: {
        profile: {
          include: { rules: { where: { enabled: true } } },
        },
      },
    });
  }

  async findBuiltinFingerprints() {
    return prisma.botRule.findMany({
      where: { isBuiltin: true },
      orderBy: { clientLabel: 'asc' },
    });
  }
}

export const botManagerRepository = new BotManagerRepository();

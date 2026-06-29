import logger from '../../utils/logger';
import prisma from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { botManagerRepository } from './bot-manager.repository';
import { botNginxService } from './services/bot-nginx.service';
import { botAnalyticsService } from './services/bot-analytics.service';
import { domainsService } from '../domains/domains.service';
import {
  CreateBotProfileInput,
  UpdateBotProfileInput,
  CreateBotRuleInput,
  UpdateBotRuleInput,
  BotProfileQueryOptions,
  BotRuleQueryOptions,
  AssignProfileInput,
  BotNginxResult,
} from './bot-manager.types';
import { validateFingerprint, sanitizeFingerprint } from './utils/fingerprint-validators';

export class BotManagerService {
  async getProfiles(options: BotProfileQueryOptions) {
    return botManagerRepository.findAllProfiles(options);
  }

  async getProfileById(id: string) {
    const profile = await botManagerRepository.findProfileById(id);
    if (!profile) throw new NotFoundError('Bot profile not found');
    return profile;
  }

  async createProfile(data: CreateBotProfileInput) {
    const existing = await botManagerRepository.findProfileByName(data.name);
    if (existing) throw new ValidationError('Bot profile with this name already exists');

    const profile = await botManagerRepository.createProfile(data);
    await botNginxService.applyAll();
    logger.info(`Bot profile created: ${profile.name}`);
    return profile;
  }

  async updateProfile(id: string, data: UpdateBotProfileInput) {
    await this.getProfileById(id);
    if (data.name) {
      const existing = await botManagerRepository.findProfileByName(data.name);
      if (existing && existing.id !== id) {
        throw new ValidationError('Bot profile with this name already exists');
      }
    }
    const profile = await botManagerRepository.updateProfile(id, data);
    await botNginxService.applyAll();
    await this.regenerateAffectedDomains(id);
    return profile;
  }

  async deleteProfile(id: string) {
    const profile = await this.getProfileById(id);
    const domainIds = profile.domains.map((d) => d.domainId);
    await botManagerRepository.deleteProfile(id);
    await botNginxService.deleteProfileConfig(profile.name);
    await botNginxService.applyAll();
    for (const domainId of domainIds) {
      await domainsService.regenerateConfig(domainId);
    }
  }

  async toggleProfile(id: string) {
    const profile = await this.getProfileById(id);
    const updated = await botManagerRepository.toggleProfile(id, !profile.enabled);
    await botNginxService.applyAll();
    await this.regenerateAffectedDomains(id);
    return updated;
  }

  async getRules(options: BotRuleQueryOptions) {
    return botManagerRepository.findRules(options);
  }

  async getGlobalRules() {
    return botManagerRepository.findGlobalRules();
  }

  async createRule(data: CreateBotRuleInput) {
    this.validateRuleInput(data);
    const rule = await botManagerRepository.createRule({
      ...data,
      fingerprint: sanitizeFingerprint(data.fingerprint),
    });
    await botNginxService.applyAll();
    if (data.profileId) await this.regenerateAffectedDomains(data.profileId);
    return rule;
  }

  async updateRule(id: string, data: UpdateBotRuleInput) {
    const existing = await botManagerRepository.findRuleById(id);
    if (!existing) throw new NotFoundError('Bot rule not found');

    if (
      data.name !== undefined ||
      data.fingerprintType !== undefined ||
      data.fingerprint !== undefined ||
      data.action !== undefined
    ) {
      this.validateRuleInput({
        fingerprintType: data.fingerprintType ?? existing.fingerprintType,
        fingerprint: data.fingerprint ?? existing.fingerprint,
        name: data.name ?? existing.name,
        action: data.action ?? existing.action,
      });
    }

    const rule = await botManagerRepository.updateRule(id, {
      ...data,
      ...(data.fingerprint ? { fingerprint: sanitizeFingerprint(data.fingerprint) } : {}),
    });
    await botNginxService.applyAll();
    if (existing.profileId) await this.regenerateAffectedDomains(existing.profileId);
    return rule;
  }

  async deleteRule(id: string) {
    const rule = await botManagerRepository.findRuleById(id);
    if (!rule) throw new NotFoundError('Bot rule not found');
    await botManagerRepository.deleteRule(id);
    await botNginxService.applyAll();
    if (rule.profileId) await this.regenerateAffectedDomains(rule.profileId);
  }

  async toggleRule(id: string) {
    const rule = await botManagerRepository.findRuleById(id);
    if (!rule) throw new NotFoundError('Bot rule not found');
    const updated = await botManagerRepository.toggleRule(id, !rule.enabled);
    await botNginxService.applyAll();
    if (rule.profileId) await this.regenerateAffectedDomains(rule.profileId);
    return updated;
  }

  async assignProfileToDomain(profileId: string, input: AssignProfileInput) {
    await this.getProfileById(profileId);
    await botManagerRepository.assignProfileToDomain(
      profileId,
      input.domainId,
      input.enabled ?? true
    );
    await domainsService.regenerateConfig(input.domainId);
    await botNginxService.reloadNginx();
  }

  async removeProfileFromDomain(profileId: string, domainId: string) {
    await botManagerRepository.removeProfileFromDomain(profileId, domainId);
    await domainsService.regenerateConfig(domainId);
    await botNginxService.reloadNginx();
  }

  async getProfilesByDomain(domainId: string) {
    return botManagerRepository.findProfilesByDomainId(domainId);
  }

  async previewConfig(): Promise<string> {
    return botNginxService.previewAll();
  }

  async applyRules(): Promise<BotNginxResult> {
    return botNginxService.applyAll();
  }

  async getFingerprints(options: BotRuleQueryOptions) {
    return botManagerRepository.findRules({ ...options, isBuiltin: options.isBuiltin });
  }

  async getAnalytics(options: { domain?: string; limit?: number }) {
    return botAnalyticsService.getAnalytics(options);
  }

  async discoverFingerprints(options: { limit?: number; minCount?: number }) {
    return botAnalyticsService.discoverFingerprints(options);
  }

  async setDomainBotManagerEnabled(domainId: string, enabled: boolean) {
    await prisma.domain.update({
      where: { id: domainId },
      data: { botManagerEnabled: enabled },
    });
    await domainsService.regenerateConfig(domainId);
    await botNginxService.reloadNginx();
  }

  private validateRuleInput(data: {
    name: string;
    fingerprintType: CreateBotRuleInput['fingerprintType'];
    fingerprint: string;
    action: CreateBotRuleInput['action'];
  }) {
    if (!data.name?.trim()) throw new ValidationError('Rule name is required');
    const result = validateFingerprint(data.fingerprintType, data.fingerprint);
    if (!result.valid) throw new ValidationError(result.error!);
  }

  private async regenerateAffectedDomains(profileId: string) {
    const profile = await botManagerRepository.findProfileById(profileId);
    if (!profile) return;
    for (const d of profile.domains) {
      await domainsService.regenerateConfig(d.domainId);
    }
  }
}

export const botManagerService = new BotManagerService();

import api from './api';

export type Ja4FingerprintType = 'ja4' | 'ja4h' | 'ja4s' | 'ja4tcp' | 'ja4one';
export type BotPolicyMode = 'blacklist' | 'whitelist';
export type BotRuleAction = 'allow' | 'deny' | 'log_only';

export interface BotRule {
  id: string;
  profileId?: string | null;
  name: string;
  fingerprintType: Ja4FingerprintType;
  fingerprint: string;
  action: BotRuleAction;
  enabled: boolean;
  priority: number;
  notes?: string | null;
  clientLabel?: string | null;
  isBuiltin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BotProfile {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  policyMode: BotPolicyMode;
  rules?: BotRule[];
  domains?: Array<{
    id: string;
    domainId: string;
    enabled: boolean;
    domain: { id: string; name: string; status: string };
  }>;
  _count?: { rules: number; domains: number };
}

export interface FingerprintStats {
  fingerprintType: Ja4FingerprintType;
  fingerprint: string;
  count: number;
}

export interface BotAnalytics {
  totalRequests: number;
  uniqueFingerprints: number;
  topFingerprints: FingerprintStats[];
  byType: Record<string, number>;
}

export const botManagerService = {
  async getProfiles(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get<{ success: boolean; data: BotProfile[]; pagination: unknown }>(
      '/bot-manager/profiles',
      { params }
    );
    return response.data;
  },

  async getProfile(id: string) {
    const response = await api.get<{ success: boolean; data: BotProfile }>(`/bot-manager/profiles/${id}`);
    return response.data.data;
  },

  async createProfile(data: {
    name: string;
    description?: string;
    enabled?: boolean;
    policyMode?: BotPolicyMode;
  }) {
    const response = await api.post<{ success: boolean; data: BotProfile }>('/bot-manager/profiles', data);
    return response.data.data;
  },

  async updateProfile(id: string, data: Partial<BotProfile>) {
    const response = await api.put<{ success: boolean; data: BotProfile }>(`/bot-manager/profiles/${id}`, data);
    return response.data.data;
  },

  async deleteProfile(id: string) {
    await api.delete(`/bot-manager/profiles/${id}`);
  },

  async toggleProfile(id: string) {
    const response = await api.patch<{ success: boolean; data: BotProfile }>(`/bot-manager/profiles/${id}/toggle`);
    return response.data.data;
  },

  async getGlobalRules() {
    const response = await api.get<{ success: boolean; data: BotRule[] }>('/bot-manager/global-rules');
    return response.data.data;
  },

  async createGlobalRule(data: Omit<BotRule, 'id' | 'enabled' | 'isBuiltin'> & { enabled?: boolean }) {
    const response = await api.post<{ success: boolean; data: BotRule }>('/bot-manager/global-rules', data);
    return response.data.data;
  },

  async createProfileRule(profileId: string, data: Omit<BotRule, 'id' | 'profileId' | 'isBuiltin'>) {
    const response = await api.post<{ success: boolean; data: BotRule }>(
      `/bot-manager/profiles/${profileId}/rules`,
      data
    );
    return response.data.data;
  },

  async updateRule(ruleId: string, data: Partial<BotRule>) {
    const response = await api.put<{ success: boolean; data: BotRule }>(`/bot-manager/rules/${ruleId}`, data);
    return response.data.data;
  },

  async deleteRule(ruleId: string) {
    await api.delete(`/bot-manager/rules/${ruleId}`);
  },

  async toggleRule(ruleId: string) {
    const response = await api.patch<{ success: boolean; data: BotRule }>(`/bot-manager/rules/${ruleId}/toggle`);
    return response.data.data;
  },

  async assignDomain(profileId: string, domainId: string) {
    await api.post(`/bot-manager/profiles/${profileId}/assign-domain`, { domainId });
  },

  async removeDomain(profileId: string, domainId: string) {
    await api.delete(`/bot-manager/profiles/${profileId}/domains/${domainId}`);
  },

  async previewConfig() {
    const response = await api.get<{ success: boolean; data: { config: string } }>('/bot-manager/preview');
    return response.data.data.config;
  },

  async applyRules() {
    const response = await api.post<{ success: boolean; message: string }>('/bot-manager/apply');
    return response.data;
  },

  async getFingerprints(params?: { isBuiltin?: boolean; search?: string }) {
    const response = await api.get<{ success: boolean; data: BotRule[] }>('/bot-manager/fingerprints', { params });
    return response.data.data;
  },

  async discoverFingerprints(params?: { limit?: number; minCount?: number }) {
    const response = await api.post<{ success: boolean; data: FingerprintStats[] }>(
      '/bot-manager/fingerprints/discover',
      null,
      { params }
    );
    return response.data.data;
  },

  async getAnalytics(params?: { domain?: string; limit?: number }) {
    const response = await api.get<{ success: boolean; data: BotAnalytics }>('/bot-manager/analytics', { params });
    return response.data.data;
  },
};

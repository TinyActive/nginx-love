import {
  BotProfile,
  BotRule,
  BotProfileDomain,
  BotPolicyMode,
  BotRuleAction,
  Ja4FingerprintType,
  Domain,
} from '@prisma/client';

export { BotPolicyMode, BotRuleAction, Ja4FingerprintType };

export interface BotRuleEntity extends BotRule {}

export interface BotProfileWithRelations extends BotProfile {
  rules: BotRule[];
  domains: (BotProfileDomain & { domain: Pick<Domain, 'id' | 'name' | 'status'> })[];
  _count?: { rules: number; domains: number };
}

export interface CreateBotProfileInput {
  name: string;
  description?: string;
  enabled?: boolean;
  policyMode?: BotPolicyMode;
}

export interface UpdateBotProfileInput {
  name?: string;
  description?: string;
  enabled?: boolean;
  policyMode?: BotPolicyMode;
}

export interface CreateBotRuleInput {
  name: string;
  fingerprintType: Ja4FingerprintType;
  fingerprint: string;
  action: BotRuleAction;
  enabled?: boolean;
  priority?: number;
  notes?: string;
  clientLabel?: string;
  profileId?: string | null;
}

export interface UpdateBotRuleInput {
  name?: string;
  fingerprintType?: Ja4FingerprintType;
  fingerprint?: string;
  action?: BotRuleAction;
  enabled?: boolean;
  priority?: number;
  notes?: string;
  clientLabel?: string;
}

export interface AssignProfileInput {
  domainId: string;
  enabled?: boolean;
}

export interface BotProfileQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
  policyMode?: BotPolicyMode;
}

export interface BotRuleQueryOptions {
  profileId?: string | null;
  fingerprintType?: Ja4FingerprintType;
  action?: BotRuleAction;
  enabled?: boolean;
  isBuiltin?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BotNginxResult {
  success: boolean;
  message: string;
}

export interface FingerprintStats {
  fingerprintType: Ja4FingerprintType;
  fingerprint: string;
  count: number;
  lastSeen?: string;
}

export interface BotAnalyticsResult {
  totalRequests: number;
  uniqueFingerprints: number;
  topFingerprints: FingerprintStats[];
  byType: Record<string, number>;
}

export const JA4_DIRECTIVE_MAP: Record<Ja4FingerprintType, { allow: string; deny: string }> = {
  ja4: { allow: 'ja4_allow', deny: 'ja4_deny' },
  ja4h: { allow: 'ja4h_allow', deny: 'ja4h_deny' },
  ja4s: { allow: 'ja4s_allow', deny: 'ja4s_deny' },
  ja4tcp: { allow: 'ja4tcp_allow', deny: 'ja4tcp_deny' },
  ja4one: { allow: 'ja4one_allow', deny: 'ja4one_deny' },
};

/** Types supported by the bundled TinyActive JA4 dynamic module (Feature/uypdate). */
export const JA4_ENFORCEABLE_TYPES: Ja4FingerprintType[] = [
  'ja4',
  'ja4h',
  'ja4s',
  'ja4tcp',
  'ja4one',
];

export const ALL_FINGERPRINT_TYPES: Ja4FingerprintType[] = [...JA4_ENFORCEABLE_TYPES];

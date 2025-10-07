/**
 * ModSecurity domain types
 */

export interface CRSRuleDefinition {
  ruleFile: string;
  name: string;
  category: string;
  description: string;
  ruleIdRange?: string;
  paranoia?: number;
}

export interface CRSRule {
  id?: string;
  ruleFile: string;
  name: string;
  category: string;
  description: string | null;
  enabled: boolean;
  paranoia: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ModSecRule {
  id: string;
  name: string;
  category: string;
  ruleContent: string;
  description?: string;
  domainId?: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModSecRuleWithDomain extends ModSecRule {
  domain?: {
    id: string;
    name: string;
  } | null;
}

export interface GlobalModSecSettings {
  enabled: boolean;
  config: {
    id: string;
    configType: string;
    name: string;
    content: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export interface ModSecConfig {
  id: string;
  configType: string;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NginxReloadOptions {
  silent?: boolean;
}

export interface NginxReloadResult {
  success: boolean;
  message?: string;
}

import { AclRule } from '@prisma/client';

/**
 * ACL domain types and enums
 */

export enum AclType {
  WHITELIST = 'whitelist',
  BLACKLIST = 'blacklist'
}

export enum AclField {
  IP = 'ip',
  GEOIP = 'geoip',
  USER_AGENT = 'user_agent',
  URL = 'url',
  METHOD = 'method',
  HEADER = 'header'
}

export enum AclOperator {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  REGEX = 'regex'
}

export enum AclAction {
  ALLOW = 'allow',
  DENY = 'deny',
  CHALLENGE = 'challenge'
}

/**
 * ACL Rule entity type
 */
export type AclRuleEntity = AclRule;

/**
 * ACL Rule creation data
 */
export interface CreateAclRuleData {
  name: string;
  type: string;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  action: string;
  enabled?: boolean;
}

/**
 * ACL Rule update data
 */
export interface UpdateAclRuleData {
  name?: string;
  type?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
  action?: string;
  enabled?: boolean;
}

/**
 * ACL Nginx operation result
 */
export interface AclNginxResult {
  success: boolean;
  message: string;
}

/**
 * ACL Nginx configuration
 */
export interface AclNginxConfig {
  configFile: string;
  testCommand: string;
  reloadCommand: string;
}

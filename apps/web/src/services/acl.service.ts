import api from './api';
import { ACLRule } from '@/types';

interface CreateAclRuleDto {
  name: string;
  type: 'whitelist' | 'blacklist';
  conditionField: 'ip' | 'geoip' | 'user-agent' | 'url' | 'method' | 'header';
  conditionOperator: 'equals' | 'contains' | 'regex';
  conditionValue: string;
  action: 'allow' | 'deny' | 'challenge';
  enabled?: boolean;
}

interface UpdateAclRuleDto extends Partial<CreateAclRuleDto> {}

export const aclService = {
  /**
   * Get all ACL rules
   */
  async getAll(): Promise<ACLRule[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/acl');
    
    // Transform backend format to frontend format
    return response.data.data.map((rule: any) => ({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      condition: {
        field: rule.conditionField.replace('_', '-'), // user_agent -> user-agent
        operator: rule.conditionOperator,
        value: rule.conditionValue
      },
      action: rule.action,
      enabled: rule.enabled
    }));
  },

  /**
   * Get single ACL rule by ID
   */
  async getById(id: string): Promise<ACLRule> {
    const response = await api.get<{ success: boolean; data: any }>(`/acl/${id}`);
    const rule = response.data.data;
    
    return {
      id: rule.id,
      name: rule.name,
      type: rule.type,
      condition: {
        field: rule.conditionField.replace('_', '-'),
        operator: rule.conditionOperator,
        value: rule.conditionValue
      },
      action: rule.action,
      enabled: rule.enabled
    };
  },

  /**
   * Create new ACL rule
   */
  async create(data: CreateAclRuleDto): Promise<ACLRule> {
    const response = await api.post<{ success: boolean; message: string; data: any }>('/acl', data);
    const rule = response.data.data;
    
    return {
      id: rule.id,
      name: rule.name,
      type: rule.type,
      condition: {
        field: rule.conditionField.replace('_', '-'),
        operator: rule.conditionOperator,
        value: rule.conditionValue
      },
      action: rule.action,
      enabled: rule.enabled
    };
  },

  /**
   * Update ACL rule
   */
  async update(id: string, data: UpdateAclRuleDto): Promise<ACLRule> {
    const response = await api.put<{ success: boolean; message: string; data: any }>(`/acl/${id}`, data);
    const rule = response.data.data;
    
    return {
      id: rule.id,
      name: rule.name,
      type: rule.type,
      condition: {
        field: rule.conditionField.replace('_', '-'),
        operator: rule.conditionOperator,
        value: rule.conditionValue
      },
      action: rule.action,
      enabled: rule.enabled
    };
  },

  /**
   * Delete ACL rule
   */
  async delete(id: string): Promise<void> {
    await api.delete<{ success: boolean; message: string }>(`/acl/${id}`);
  },

  /**
   * Toggle ACL rule enabled status
   */
  async toggle(id: string): Promise<ACLRule> {
    const response = await api.patch<{ success: boolean; message: string; data: any }>(`/acl/${id}/toggle`);
    const rule = response.data.data;
    
    return {
      id: rule.id,
      name: rule.name,
      type: rule.type,
      condition: {
        field: rule.conditionField.replace('_', '-'),
        operator: rule.conditionOperator,
        value: rule.conditionValue
      },
      action: rule.action,
      enabled: rule.enabled
    };
  },

  /**
   * Preview ACL configuration
   */
  async preview(): Promise<{ config: string; rulesCount: number }> {
    const response = await api.get<{ success: boolean; data: { config: string; rulesCount: number } }>('/acl/preview');
    return response.data.data;
  },

  /**
   * Apply ACL rules to Nginx
   */
  async apply(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/acl/apply');
    return response.data;
  }
};

export default aclService;

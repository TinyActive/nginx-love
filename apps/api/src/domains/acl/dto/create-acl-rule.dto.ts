/**
 * DTO for creating ACL rule
 */
export interface CreateAclRuleDto {
  name: string;
  type: string;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  action: string;
  enabled?: boolean;
}

/**
 * Validates create ACL rule DTO
 */
export function validateCreateAclRuleDto(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!data.type || typeof data.type !== 'string') {
    errors.push('Type is required and must be a string');
  }

  if (!data.conditionField || typeof data.conditionField !== 'string') {
    errors.push('Condition field is required and must be a string');
  }

  if (!data.conditionOperator || typeof data.conditionOperator !== 'string') {
    errors.push('Condition operator is required and must be a string');
  }

  if (!data.conditionValue || typeof data.conditionValue !== 'string') {
    errors.push('Condition value is required and must be a string');
  }

  if (!data.action || typeof data.action !== 'string') {
    errors.push('Action is required and must be a string');
  }

  if (data.enabled !== undefined && typeof data.enabled !== 'boolean') {
    errors.push('Enabled must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * DTO for updating ACL rule
 */
export interface UpdateAclRuleDto {
  name?: string;
  type?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
  action?: string;
  enabled?: boolean;
}

/**
 * Validates update ACL rule DTO
 */
export function validateUpdateAclRuleDto(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.name !== undefined && (typeof data.name !== 'string' || !data.name.trim())) {
    errors.push('Name must be a non-empty string');
  }

  if (data.type !== undefined && typeof data.type !== 'string') {
    errors.push('Type must be a string');
  }

  if (data.conditionField !== undefined && typeof data.conditionField !== 'string') {
    errors.push('Condition field must be a string');
  }

  if (data.conditionOperator !== undefined && typeof data.conditionOperator !== 'string') {
    errors.push('Condition operator must be a string');
  }

  if (data.conditionValue !== undefined && typeof data.conditionValue !== 'string') {
    errors.push('Condition value must be a string');
  }

  if (data.action !== undefined && typeof data.action !== 'string') {
    errors.push('Action must be a string');
  }

  if (data.enabled !== undefined && typeof data.enabled !== 'boolean') {
    errors.push('Enabled must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

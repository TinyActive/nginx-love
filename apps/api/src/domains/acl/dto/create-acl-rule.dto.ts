import { validateAclValue, sanitizeValue } from '../utils/validators';

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

  // Validate name
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Name is required and must be a non-empty string');
  } else if (data.name.length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  // Validate type
  const validTypes = ['whitelist', 'blacklist'];
  if (!data.type || typeof data.type !== 'string') {
    errors.push('Type is required and must be a string');
  } else if (!validTypes.includes(data.type)) {
    errors.push(`Type must be one of: ${validTypes.join(', ')}`);
  }

  // Validate condition field
  const validFields = ['ip', 'geoip', 'user_agent', 'url', 'method', 'header'];
  if (!data.conditionField || typeof data.conditionField !== 'string') {
    errors.push('Condition field is required and must be a string');
  } else if (!validFields.includes(data.conditionField)) {
    errors.push(`Condition field must be one of: ${validFields.join(', ')}`);
  }

  // Validate condition operator
  const validOperators = ['equals', 'contains', 'regex'];
  if (!data.conditionOperator || typeof data.conditionOperator !== 'string') {
    errors.push('Condition operator is required and must be a string');
  } else if (!validOperators.includes(data.conditionOperator)) {
    errors.push(`Condition operator must be one of: ${validOperators.join(', ')}`);
  }

  // Validate condition value
  if (!data.conditionValue || typeof data.conditionValue !== 'string') {
    errors.push('Condition value is required and must be a string');
  } else if (data.conditionValue.trim().length === 0) {
    errors.push('Condition value cannot be empty');
  } else {
    // Perform field-specific validation
    const valueValidation = validateAclValue(
      data.conditionField,
      data.conditionOperator,
      data.conditionValue
    );
    
    if (!valueValidation.valid) {
      errors.push(valueValidation.error || 'Invalid condition value');
    }
  }

  // Validate action
  const validActions = ['allow', 'deny', 'challenge'];
  if (!data.action || typeof data.action !== 'string') {
    errors.push('Action is required and must be a string');
  } else if (!validActions.includes(data.action)) {
    errors.push(`Action must be one of: ${validActions.join(', ')}`);
  }

  // Validate enabled
  if (data.enabled !== undefined && typeof data.enabled !== 'boolean') {
    errors.push('Enabled must be a boolean');
  }

  // Validate type-action combinations
  if (data.type === 'whitelist' && data.action === 'deny') {
    errors.push('Whitelist rules should use "allow" action, not "deny"');
  }
  if (data.type === 'blacklist' && data.action === 'allow') {
    errors.push('Blacklist rules should use "deny" action, not "allow"');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

import { validateAclValue } from '../utils/validators';

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

  // Validate name
  if (data.name !== undefined && (typeof data.name !== 'string' || !data.name.trim())) {
    errors.push('Name must be a non-empty string');
  } else if (data.name && data.name.length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  // Validate type
  const validTypes = ['whitelist', 'blacklist'];
  if (data.type !== undefined && typeof data.type !== 'string') {
    errors.push('Type must be a string');
  } else if (data.type && !validTypes.includes(data.type)) {
    errors.push(`Type must be one of: ${validTypes.join(', ')}`);
  }

  // Validate condition field
  const validFields = ['ip', 'geoip', 'user_agent', 'url', 'method', 'header'];
  if (data.conditionField !== undefined && typeof data.conditionField !== 'string') {
    errors.push('Condition field must be a string');
  } else if (data.conditionField && !validFields.includes(data.conditionField)) {
    errors.push(`Condition field must be one of: ${validFields.join(', ')}`);
  }

  // Validate condition operator
  const validOperators = ['equals', 'contains', 'regex'];
  if (data.conditionOperator !== undefined && typeof data.conditionOperator !== 'string') {
    errors.push('Condition operator must be a string');
  } else if (data.conditionOperator && !validOperators.includes(data.conditionOperator)) {
    errors.push(`Condition operator must be one of: ${validOperators.join(', ')}`);
  }

  // Validate condition value with field-specific validation
  if (data.conditionValue !== undefined) {
    if (typeof data.conditionValue !== 'string') {
      errors.push('Condition value must be a string');
    } else if (data.conditionValue.trim().length === 0) {
      errors.push('Condition value cannot be empty');
    } else if (data.conditionField && data.conditionOperator) {
      // Perform field-specific validation if we have all required fields
      const valueValidation = validateAclValue(
        data.conditionField,
        data.conditionOperator,
        data.conditionValue
      );
      
      if (!valueValidation.valid) {
        errors.push(valueValidation.error || 'Invalid condition value');
      }
    }
  }

  // Validate action
  const validActions = ['allow', 'deny', 'challenge'];
  if (data.action !== undefined && typeof data.action !== 'string') {
    errors.push('Action must be a string');
  } else if (data.action && !validActions.includes(data.action)) {
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

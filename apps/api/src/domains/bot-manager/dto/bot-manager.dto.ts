const FINGERPRINT_TYPES = ['ja4', 'ja4h', 'ja4s', 'ja4tcp', 'ja4one'] as const;
const POLICY_MODES = ['blacklist', 'whitelist'] as const;
const RULE_ACTIONS = ['allow', 'deny', 'log_only'] as const;

export function validateCreateBotProfile(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('Profile name is required');
  }
  if (body.policyMode && !POLICY_MODES.includes(body.policyMode as typeof POLICY_MODES[number])) {
    errors.push('Invalid policy mode');
  }
  return errors;
}

export function validateUpdateBotProfile(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
    errors.push('Profile name cannot be empty');
  }
  if (body.policyMode && !POLICY_MODES.includes(body.policyMode as typeof POLICY_MODES[number])) {
    errors.push('Invalid policy mode');
  }
  return errors;
}

export function validateCreateBotRule(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('Rule name is required');
  }
  if (!body.fingerprintType || !FINGERPRINT_TYPES.includes(body.fingerprintType as typeof FINGERPRINT_TYPES[number])) {
    errors.push('Valid fingerprint type is required');
  }
  if (!body.fingerprint || typeof body.fingerprint !== 'string' || !body.fingerprint.trim()) {
    errors.push('Fingerprint is required');
  }
  if (!body.action || !RULE_ACTIONS.includes(body.action as typeof RULE_ACTIONS[number])) {
    errors.push('Valid action is required');
  }
  return errors;
}

export function validateUpdateBotRule(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
    errors.push('Rule name cannot be empty');
  }
  if (body.fingerprintType && !FINGERPRINT_TYPES.includes(body.fingerprintType as typeof FINGERPRINT_TYPES[number])) {
    errors.push('Invalid fingerprint type');
  }
  if (body.action && !RULE_ACTIONS.includes(body.action as typeof RULE_ACTIONS[number])) {
    errors.push('Invalid action');
  }
  return errors;
}

export function validateAssignProfile(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!body.domainId || typeof body.domainId !== 'string') {
    errors.push('Domain ID is required');
  }
  return errors;
}

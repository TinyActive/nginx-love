const FINGERPRINT_TYPES = ['ja4', 'ja4h', 'ja4s', 'ja4tcp', 'ja4one'] as const;
const POLICY_MODES = ['blacklist', 'whitelist'] as const;
const RULE_ACTIONS = ['allow', 'deny', 'log_only'] as const;

function validateNameField(name: unknown, requiredMessage: string, emptyMessage: string): string | null {
  if (typeof name !== 'string' || !name.trim()) {
    return requiredMessage;
  }
  if (/[\r\n]/.test(name)) {
    return emptyMessage.includes('empty') ? 'Name cannot contain newline characters' : 'Profile name cannot contain newline characters';
  }
  return null;
}

function validateFingerprintField(fingerprint: unknown): string | null {
  if (typeof fingerprint !== 'string' || !fingerprint.trim()) {
    return 'Fingerprint is required';
  }
  if (/[\r\n]/.test(fingerprint)) {
    return 'Fingerprint cannot contain newline characters';
  }
  return null;
}

export function validateCreateBotProfile(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const nameError = validateNameField(body.name, 'Profile name is required', 'Profile name cannot be empty');
  if (nameError) errors.push(nameError);
  if (body.policyMode && !POLICY_MODES.includes(body.policyMode as typeof POLICY_MODES[number])) {
    errors.push('Invalid policy mode');
  }
  return errors;
}

export function validateUpdateBotProfile(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (body.name !== undefined) {
    const nameError = validateNameField(body.name, 'Profile name cannot be empty', 'Profile name cannot be empty');
    if (nameError) errors.push(nameError);
  }
  if (body.policyMode && !POLICY_MODES.includes(body.policyMode as typeof POLICY_MODES[number])) {
    errors.push('Invalid policy mode');
  }
  return errors;
}

export function validateCreateBotRule(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const nameError = validateNameField(body.name, 'Rule name is required', 'Rule name cannot be empty');
  if (nameError) errors.push(nameError);
  if (!body.fingerprintType || !FINGERPRINT_TYPES.includes(body.fingerprintType as typeof FINGERPRINT_TYPES[number])) {
    errors.push('Valid fingerprint type is required');
  }
  if (!body.fingerprint || typeof body.fingerprint !== 'string' || !body.fingerprint.trim()) {
    errors.push('Fingerprint is required');
  } else {
    const fpError = validateFingerprintField(body.fingerprint);
    if (fpError) errors.push(fpError);
  }
  if (!body.action || !RULE_ACTIONS.includes(body.action as typeof RULE_ACTIONS[number])) {
    errors.push('Valid action is required');
  }
  return errors;
}

export function validateUpdateBotRule(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (body.name !== undefined) {
    const nameError = validateNameField(body.name, 'Rule name cannot be empty', 'Rule name cannot be empty');
    if (nameError) errors.push(nameError);
  }
  if (body.fingerprint !== undefined) {
    const fpError = validateFingerprintField(body.fingerprint);
    if (fpError) errors.push(fpError);
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

import { validateFingerprintPattern } from '@nginx-love/shared';
import { Ja4FingerprintType } from '../bot-manager.types';

export interface FingerprintValidationResult {
  valid: boolean;
  error?: string;
}

export { sanitizeNginxCommentText, hasInvalidNameCharacters } from '@nginx-love/shared';

export function validateFingerprint(
  type: Ja4FingerprintType,
  fingerprint: string
): FingerprintValidationResult {
  return validateFingerprintPattern(type, fingerprint);
}

export function sanitizeFingerprint(fingerprint: string): string {
  return fingerprint.trim().replace(/[\r\n]/g, '');
}

export function sanitizeProfileName(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
}

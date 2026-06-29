export type Ja4FingerprintType = 'ja4' | 'ja4h' | 'ja4s' | 'ja4tcp' | 'ja4one';

const JA4_PATTERN = /^t\d+d\d+h\d+_[a-f0-9]{64}_[a-f0-9]{64}$/i;
const JA4H_PATTERN = /^[a-z]{2}\d{2}[nc]\d{2}_[a-f0-9]{64}$/i;
const JA4S_PATTERN = /^h2\d+_\d+_[a-f0-9]+_\d+_\d+$/i;
const JA4TCP_PATTERN = /^\d+_\d+(-\d+)*_\d+_\d+$/;
const JA4ONE_PATTERN = /^[^_\r\n]{1,256}_[^_\r\n]{1,256}$/;

export const FINGERPRINT_PATTERNS: Record<Ja4FingerprintType, RegExp> = {
  ja4: JA4_PATTERN,
  ja4h: JA4H_PATTERN,
  ja4s: JA4S_PATTERN,
  ja4tcp: JA4TCP_PATTERN,
  ja4one: JA4ONE_PATTERN,
};

export const FINGERPRINT_TYPE_HINTS: Record<Ja4FingerprintType, string> = {
  ja4: 't13d1516h2_<64-char-hash>_<64-char-hash>',
  ja4h: 'ge11n03_<64-char-hash>',
  ja4s: 'h220_02_<hash>_<window>_0',
  ja4tcp: '65535_2-4-8-3_1460_7',
  ja4one: '<ja4>_<ja4h>',
};

export interface FingerprintValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFingerprintPattern(
  type: Ja4FingerprintType,
  fingerprint: string
): FingerprintValidationResult {
  const trimmed = fingerprint.trim();
  if (!trimmed) {
    return { valid: false, error: 'Fingerprint is required' };
  }

  if (/[\r\n]/.test(trimmed)) {
    return { valid: false, error: 'Fingerprint cannot contain newline characters' };
  }

  if (trimmed.length > 512) {
    return { valid: false, error: 'Fingerprint is too long' };
  }

  const pattern = FINGERPRINT_PATTERNS[type];
  if (!pattern.test(trimmed)) {
    return {
      valid: false,
      error: `Invalid ${type.toUpperCase()} format. Expected: ${FINGERPRINT_TYPE_HINTS[type]}`,
    };
  }

  return { valid: true };
}

/** Strip newlines from strings embedded in nginx config comments. */
export function sanitizeNginxCommentText(text: string): string {
  return text.replace(/[\r\n]/g, '');
}

/** Reject profile/rule names that contain newline characters. */
export function hasInvalidNameCharacters(name: string): boolean {
  return /[\r\n]/.test(name);
}

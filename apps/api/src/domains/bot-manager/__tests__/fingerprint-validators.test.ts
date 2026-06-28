import { describe, it, expect } from 'vitest';
import { validateFingerprint, sanitizeProfileName } from '../utils/fingerprint-validators';

describe('fingerprint-validators', () => {
  it('validates JA4TCP pattern', () => {
    const result = validateFingerprint('ja4tcp', '29200_2-4-8-1-3_1460_7');
    expect(result.valid).toBe(true);
  });

  it('rejects empty fingerprint', () => {
    const result = validateFingerprint('ja4', '');
    expect(result.valid).toBe(false);
  });

  it('validates JA4H pattern', () => {
    const hash = 'a'.repeat(64);
    const result = validateFingerprint('ja4h', `ge11n03_${hash}`);
    expect(result.valid).toBe(true);
  });

  it('sanitizes profile names for nginx filenames', () => {
    expect(sanitizeProfileName('API Strict!')).toBe('api-strict-');
  });
});

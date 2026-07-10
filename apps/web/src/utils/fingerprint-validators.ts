import {
  validateFingerprintPattern,
  type Ja4FingerprintType as SharedJa4Type,
} from '@nginx-love/shared';
import type { Ja4FingerprintType } from '@/services/bot-manager.service';

export function validateFingerprint(type: Ja4FingerprintType, fingerprint: string): string | null {
  const result = validateFingerprintPattern(type as SharedJa4Type, fingerprint);
  if (result.valid) return null;
  return result.error ?? `Invalid ${type.toUpperCase()} fingerprint format`;
}

/** Split textarea input into one fingerprint per non-empty line. */
export function parseFingerprintLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateFingerprintLines(type: Ja4FingerprintType, lines: string[]): string | null {
  if (lines.length === 0) return 'At least one fingerprint is required';
  for (let i = 0; i < lines.length; i++) {
    const err = validateFingerprint(type, lines[i]);
    if (err) return `Line ${i + 1}: ${err}`;
  }
  return null;
}

export function truncateFingerprint(fp: string, max = 32): string {
  if (fp.length <= max) return fp;
  return `${fp.slice(0, max)}…`;
}

export const FINGERPRINT_TYPE_LABELS: Record<Ja4FingerprintType, string> = {
  ja4: 'JA4 (TLS)',
  ja4h: 'JA4H (HTTP)',
  ja4s: 'JA4S (HTTP/2)',
  ja4tcp: 'JA4TCP (TCP)',
  ja4one: 'JA4one (Composite)',
};

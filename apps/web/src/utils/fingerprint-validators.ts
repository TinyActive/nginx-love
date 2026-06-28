import type { Ja4FingerprintType } from '@/services/bot-manager.service';

const JA4_PATTERN = /^t\d+d\d+h\d+_[a-f0-9]{64}_[a-f0-9]{64}$/i;
const JA4H_PATTERN = /^[a-z]{2}\d{2}[nc]\d{2}_[a-f0-9]{64}$/i;
const JA4S_PATTERN = /^h2\d+_\d+_[a-f0-9]+_\d+_\d+$/i;
const JA4TCP_PATTERN = /^\d+_\d+(-\d+)*_\d+_\d+$/;
const JA4ONE_PATTERN = /^.+_.+$/;

const PATTERNS: Record<Ja4FingerprintType, RegExp> = {
  ja4: JA4_PATTERN,
  ja4h: JA4H_PATTERN,
  ja4s: JA4S_PATTERN,
  ja4tcp: JA4TCP_PATTERN,
  ja4one: JA4ONE_PATTERN,
};

export function validateFingerprint(type: Ja4FingerprintType, fingerprint: string): string | null {
  const trimmed = fingerprint.trim();
  if (!trimmed) return 'Fingerprint is required';
  if (!PATTERNS[type].test(trimmed)) return `Invalid ${type.toUpperCase()} fingerprint format`;
  return null;
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

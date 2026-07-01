export const JA4_LOG_FIELD_NAMES = ['JA4', 'JA4H', 'JA4S', 'JA4TCP', 'JA4one'] as const;

export type Ja4LogFieldName = (typeof JA4_LOG_FIELD_NAMES)[number];

export type Ja4LogFields = Partial<Record<Lowercase<Ja4LogFieldName>, string>>;

const JA4_FIELD_TO_KEY: Record<Ja4LogFieldName, keyof Ja4LogFields> = {
  JA4: 'ja4',
  JA4H: 'ja4h',
  JA4S: 'ja4s',
  JA4TCP: 'ja4tcp',
  JA4one: 'ja4one',
};

/** Detect JA4 fingerprint data in nginx access log lines (equals or colon format). */
export function isJa4AccessLogLine(line: string): boolean {
  return /JA4(?:H|S|TCP|one)?[=:]/i.test(line) || /"JA4(?:H|S|TCP|one)?: /i.test(line);
}

function normalizeJa4Value(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') return undefined;
  return trimmed;
}

/**
 * Extract JA4 fields from nginx log lines.
 * Supports TinyActive uypdate formats:
 *   JA4="..." JA4H="..."
 *   "JA4: ..." "JA4H: ..."
 */
export function extractJa4FieldsFromLogLine(line: string): Ja4LogFields {
  const result: Ja4LogFields = {};

  for (const field of JA4_LOG_FIELD_NAMES) {
    const key = JA4_FIELD_TO_KEY[field];

    const quotedEquals = line.match(new RegExp(`${field}="([^"]*)"`, 'i'));
    if (quotedEquals) {
      const value = normalizeJa4Value(quotedEquals[1]);
      if (value) result[key] = value;
      continue;
    }

    const colonQuoted = line.match(new RegExp(`"${field}: ([^"]*)"`, 'i'));
    if (colonQuoted) {
      const value = normalizeJa4Value(colonQuoted[1]);
      if (value) result[key] = value;
    }
  }

  return result;
}

export function hasJa4FingerprintData(fields: Ja4LogFields): boolean {
  return Object.keys(fields).length > 0;
}

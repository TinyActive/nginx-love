import { describe, it, expect } from 'vitest';
import { parseJa4FingerprintLogLine } from '../services/log-parser.service';

describe('parseJa4FingerprintLogLine', () => {
  it('extracts JA4 fields from fingerprint log line', () => {
    const line =
      '192.168.1.1 - [28/Jun/2025:10:00:00 +0000] "GET /api HTTP/1.1" 200 ' +
      'JA4="t13d1516h2_abc" JA4H="ge11n03_def" JA4S="h220_02_x" JA4TCP="65535_2-4-8-3_1460_7" JA4one="combo"';

    const entry = parseJa4FingerprintLogLine(line, 0, 'example.com');
    expect(entry).not.toBeNull();
    expect(entry?.ja4).toBe('t13d1516h2_abc');
    expect(entry?.ja4h).toBe('ge11n03_def');
    expect(entry?.ja4tcp).toBe('65535_2-4-8-3_1460_7');
    expect(entry?.ja4one).toBe('combo');
    expect(entry?.statusCode).toBe(200);
    expect(entry?.source).toBe('nginx-ja4');
  });
});

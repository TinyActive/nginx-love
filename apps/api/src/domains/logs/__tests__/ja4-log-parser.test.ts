import { describe, it, expect } from 'vitest';
import { extractJa4FieldsFromLogLine } from '@nginx-love/shared';
import { parseAccessLogLine, parseJa4FingerprintLogLine } from '../services/log-parser.service';

describe('parseJa4FingerprintLogLine', () => {
  it('extracts JA4 fields from equals-quoted fingerprint log line', () => {
    const line =
      '192.168.1.1 - [28/Jun/2025:10:00:00 +0000] "GET /api HTTP/1.1" 200 ' +
      'JA4="t13d1512h2_abc123456789" JA4H="ge11n03_def123456789" JA4S="h220_02_x" JA4TCP="65535_2-4-8-3_1460_7" JA4one="t13d3012_one123456789"';

    const entry = parseJa4FingerprintLogLine(line, 0, 'example.com');
    expect(entry).not.toBeNull();
    expect(entry?.ja4).toBe('t13d1512h2_abc123456789');
    expect(entry?.ja4h).toBe('ge11n03_def123456789');
    expect(entry?.ja4tcp).toBe('65535_2-4-8-3_1460_7');
    expect(entry?.ja4one).toBe('t13d3012_one123456789');
    expect(entry?.statusCode).toBe(200);
    expect(entry?.source).toBe('nginx-ja4');
    expect(entry?.fullMessage).toBe(line);
  });

  it('extracts JA4 fields from TinyActive colon format in combined log line', () => {
    const line =
      '14.162.98.69 - - [30/Jun/2026:15:41:17 +0000] "GET / HTTP/2.0" 200 555 "-" "Mozilla/5.0" "-" ' +
      '"JA4: t13d1512h2_8daaf6152771" "JA4H: ge11nn030000_b51846f30ce9" "JA4one: t13d3012_e5627efa2ab1" ' +
      '"JA4TCP: 64240_2-4-8-1-3_1460_7" "JA4S: h220_02_70946d4d1524"';

    const entry = parseJa4FingerprintLogLine(line, 0, 'waf.autogate.cc');
    expect(entry?.ja4).toBe('t13d1512h2_8daaf6152771');
    expect(entry?.ja4h).toBe('ge11nn030000_b51846f30ce9');
    expect(entry?.ja4tcp).toBe('64240_2-4-8-1-3_1460_7');
    expect(entry?.ja4s).toBe('h220_02_70946d4d1524');
    expect(entry?.fullMessage).toBe(line);
  });

  it('skips dash placeholder values', () => {
    const line =
      '127.0.0.1 - [30/Jun/2026:09:13:33 +0000] "GET / HTTP/1.1" 200 ' +
      'JA4="-" JA4H="ge11nn030000_b51846f30ce9" JA4S="-" JA4TCP="64240_2-4-8-1-3_1460_7" JA4one="-"';

    const entry = parseJa4FingerprintLogLine(line, 0);
    expect(entry?.ja4).toBeUndefined();
    expect(entry?.ja4h).toBe('ge11nn030000_b51846f30ce9');
    expect(entry?.ja4s).toBeUndefined();
    expect(entry?.ja4tcp).toBe('64240_2-4-8-1-3_1460_7');
    expect(entry?.ja4one).toBeUndefined();
  });

  it('extractJa4Fields supports colon format via shared helper', () => {
    const fields = extractJa4FieldsFromLogLine(
      '"JA4: t13d1512h2_8daaf6152771" "JA4H: ge11nn030000_b51846f30ce9"'
    );
    expect(fields.ja4).toBe('t13d1512h2_8daaf6152771');
    expect(fields.ja4h).toBe('ge11nn030000_b51846f30ce9');
  });

  it('parses main_ja4 combined access log lines', () => {
    const line =
      '14.162.98.69 - - [30/Jun/2026:15:41:17 +0000] "GET / HTTP/2.0" 200 555 "-" "Mozilla/5.0" "-" ' +
      '"JA4: t13d1512h2_8daaf6152771" "JA4H: ge11nn030000_b51846f30ce9" "JA4one: t13d3012_e5627efa2ab1" ' +
      '"JA4TCP: 64240_2-4-8-1-3_1460_7" "JA4S: h220_02_70946d4d1524"';

    const entry = parseAccessLogLine(line, 0, 'waf.autogate.cc');
    expect(entry?.ja4).toBe('t13d1512h2_8daaf6152771');
    expect(entry?.ja4s).toBe('h220_02_70946d4d1524');
    expect(entry?.fullMessage).toBe(line);
    expect(entry?.source).toBe('nginx-ja4');
  });
});

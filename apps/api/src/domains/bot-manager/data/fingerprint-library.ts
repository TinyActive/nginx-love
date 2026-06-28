import { BotRuleAction, Ja4FingerprintType } from '@prisma/client';

/** Built-in fingerprint library — templates for Bot Manager UI and WAF demos. */
export interface FingerprintLibraryEntry {
  name: string;
  fingerprintType: Ja4FingerprintType;
  fingerprint: string;
  action: BotRuleAction;
  clientLabel: string;
  notes: string;
  /** When true, rule is enforced globally after demo setup / apply. */
  demoBlock?: boolean;
}

/**
 * Fingerprints observed against waf.autogate.cc (nginx 1.27.3 + JA4 module).
 * Re-collect from Bot Manager → Analytics if clients run from a different host/OS.
 */
export const FINGERPRINT_LIBRARY: FingerprintLibraryEntry[] = [
  {
    name: 'Python requests library (JA4H)',
    fingerprintType: 'ja4h',
    fingerprint: 'ge11n05_b223a0ebb0b5b794fff2fd565b0ce57e055a418b5ccf7f0729f2ffe1',
    action: 'deny',
    clientLabel: 'Python requests',
    notes: 'HTTP/1.1 GET, 5 headers, no cookie — typical python-requests client',
    demoBlock: true,
  },
  {
    name: 'Node.js fetch (JA4H)',
    fingerprintType: 'ja4h',
    fingerprint: 'ge11n07_4ae0f4a72b53d22c98849ff4ad7fcfbae658d9b5cd9cb18dbce01ba4',
    action: 'deny',
    clientLabel: 'Node.js fetch',
    notes: 'Node 20 native fetch — 7 headers, undici user-agent chain',
    demoBlock: true,
  },
  {
    name: 'Python urllib (JA4H)',
    fingerprintType: 'ja4h',
    fingerprint: 'ge11n04_5b1e8b5f4d2dc70584746d62eb1c153ebeebd9f6db9d8b82695ac0ad',
    action: 'deny',
    clientLabel: 'Python urllib',
    notes: 'stdlib urllib — lighter header set than requests',
    demoBlock: true,
  },
  {
    name: 'Python requests TCP window (JA4TCP)',
    fingerprintType: 'ja4tcp',
    fingerprint: '65495_2-4-8-1-3_65495_7',
    action: 'log_only',
    clientLabel: 'Python requests (TCP)',
    notes: 'TCP SYN fingerprint on this host for requests/urllib — use with JA4H for accuracy',
  },
  {
    name: 'Node.js fetch TCP (JA4TCP)',
    fingerprintType: 'ja4tcp',
    fingerprint: '64240_2-4-8-1-3_1460_7',
    action: 'log_only',
    clientLabel: 'Node.js (TCP)',
    notes: 'Common Node/OpenSSL TCP stack on Linux — reference only',
  },
  {
    name: 'curl baseline (JA4H) — allow',
    fingerprintType: 'ja4h',
    fingerprint: 'ge20n03_042112399351546892747b1253f1a8956928945e2eae262b25595c7a',
    action: 'allow',
    clientLabel: 'curl / browser-like',
    notes: 'HTTP/2 curl from test runner — should stay allowed for baseline checks',
  },
  {
    name: 'Legacy Python TCP pattern (reference)',
    fingerprintType: 'ja4tcp',
    fingerprint: '29200_2-4-8-1-3_1460_7',
    action: 'log_only',
    clientLabel: 'Python requests (legacy doc)',
    notes: 'Documented TinyActive example — may differ by kernel; prefer JA4H rules above',
  },
  {
    name: 'Small TCP window scanners (reference)',
    fingerprintType: 'ja4tcp',
    fingerprint: '1024_2-4-8_1460_0',
    action: 'log_only',
    clientLabel: 'Scanner',
    notes: 'TCP-only reference — module has no ja4tcp_deny; use JA4H rules for blocking',
  },
];

export const DEMO_BLOCK_RULES = FINGERPRINT_LIBRARY.filter((e) => e.demoBlock);

import { describe, it, expect } from 'vitest';
import { BotNginxService } from '../services/bot-nginx.service';
import { BotRuleEntity } from '../bot-manager.types';

describe('BotNginxService config generation', () => {
  const service = new BotNginxService();

  it('generates deny directives for blacklist rules', () => {
    const rules: BotRuleEntity[] = [
      {
        id: '1',
        profileId: null,
        name: 'Block Python',
        fingerprintType: 'ja4h',
        fingerprint: 'ge11n05_b223a0ebb0b5b794fff2fd565b0ce57e055a418b5ccf7f0729f2ffe1',
        action: 'deny',
        enabled: true,
        priority: 100,
        notes: null,
        clientLabel: 'Python',
        isBuiltin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const config = (service as any).buildConfigFile('Test', rules, 'blacklist');
    expect(config).toContain('ja4h_deny "ge11n05_b223a0ebb0b5b794fff2fd565b0ce57e055a418b5ccf7f0729f2ffe1"');
    expect(config).not.toContain('ja4tcp_deny');
  });

  it('generates deny all for whitelist mode with allows', () => {
    const rules: BotRuleEntity[] = [
      {
        id: '1',
        profileId: 'p1',
        name: 'Allow Chrome',
        fingerprintType: 'ja4h',
        fingerprint: 'ge11n05_b223a0ebb0b5b794fff2fd565b0ce57e055a418b5ccf7f0729f2ffe1',
        action: 'allow',
        enabled: true,
        priority: 100,
        notes: null,
        clientLabel: null,
        isBuiltin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const config = (service as any).buildConfigFile('Profile', rules, 'whitelist');
    expect(config).toContain('ja4h_allow "ge11n05_b223a0ebb0b5b794fff2fd565b0ce57e055a418b5ccf7f0729f2ffe1"');
    expect(config).toContain('ja4h_deny "all"');
  });

  it('skips log_only rules in nginx output', () => {
    const rules: BotRuleEntity[] = [
      {
        id: '1',
        profileId: null,
        name: 'Monitor',
        fingerprintType: 'ja4tcp',
        fingerprint: '8192_2-4-8-1-3_1460_7',
        action: 'log_only',
        enabled: true,
        priority: 100,
        notes: null,
        clientLabel: null,
        isBuiltin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const config = (service as any).buildConfigFile('Test', rules, 'blacklist');
    expect(config).not.toContain('ja4tcp_deny');
    expect(config).toContain('No active rules');
  });
});

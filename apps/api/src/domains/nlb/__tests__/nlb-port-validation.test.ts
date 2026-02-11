/**
 * NLB Port Validation Tests
 *
 * Validates port conflict detection logic:
 * - Reserved system ports are rejected
 * - Port range validation (1-65535)
 * - Conflict message generation
 */

import { describe, it, expect } from 'vitest';

// Mirror the RESERVED_PORTS array from nlb.service.ts for standalone testing
const RESERVED_PORTS = [
  80,    // HTTP
  443,   // HTTPS
  22,    // SSH
  25,    // SMTP
  53,    // DNS
  3306,  // MySQL
  5432,  // PostgreSQL
  6379,  // Redis
  8080,  // Nginx panel (frontend)
  3001,  // API backend
];

/**
 * Mirrors the port range validation from NLBService.createNLB / updateNLB
 */
function isValidPortRange(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Mirrors NLBService.getPortConflictMessage
 */
function getPortConflictMessage(port: number, existingNLBName?: string): string {
  if (RESERVED_PORTS.includes(port)) {
    return `Port ${port} is reserved by the system and cannot be used for NLB`;
  }
  if (existingNLBName) {
    return `Port ${port} is already in use by NLB "${existingNLBName}"`;
  }
  return `Port ${port} is already in use by another process on the system`;
}

// ----------------------------------------------------------------
describe('NLB port range validation', () => {
  it('accepts port 1 (minimum valid)', () => {
    expect(isValidPortRange(1)).toBe(true);
  });

  it('accepts port 65535 (maximum valid)', () => {
    expect(isValidPortRange(65535)).toBe(true);
  });

  it('accepts port 8081 (arbitrary mid-range)', () => {
    expect(isValidPortRange(8081)).toBe(true);
  });

  it('accepts port 443 (system port – range check only)', () => {
    expect(isValidPortRange(443)).toBe(true);
  });

  it('rejects port 0', () => {
    expect(isValidPortRange(0)).toBe(false);
  });

  it('rejects negative port', () => {
    expect(isValidPortRange(-1)).toBe(false);
  });

  it('rejects port above 65535', () => {
    expect(isValidPortRange(65536)).toBe(false);
  });

  it('rejects non-integer port', () => {
    expect(isValidPortRange(3.14)).toBe(false);
  });
});

// ----------------------------------------------------------------
describe('Reserved port detection', () => {
  it.each([
    [80, 'HTTP'],
    [443, 'HTTPS'],
    [22, 'SSH'],
    [25, 'SMTP'],
    [53, 'DNS'],
    [3306, 'MySQL'],
    [5432, 'PostgreSQL'],
    [6379, 'Redis'],
    [8080, 'Nginx panel'],
    [3001, 'API backend'],
  ])('rejects reserved port %i (%s)', (port) => {
    expect(RESERVED_PORTS.includes(port)).toBe(true);
  });

  it('allows non-reserved port 9000', () => {
    expect(RESERVED_PORTS.includes(9000)).toBe(false);
  });

  it('allows non-reserved port 10000', () => {
    expect(RESERVED_PORTS.includes(10000)).toBe(false);
  });

  it('allows non-reserved port 3000', () => {
    expect(RESERVED_PORTS.includes(3000)).toBe(false);
  });
});

// ----------------------------------------------------------------
describe('Port conflict messages', () => {
  it('returns reserved message for a system port', () => {
    expect(getPortConflictMessage(80)).toBe(
      'Port 80 is reserved by the system and cannot be used for NLB'
    );
  });

  it('returns NLB conflict message when an NLB name is provided', () => {
    expect(getPortConflictMessage(9000, 'my-nlb')).toBe(
      'Port 9000 is already in use by NLB "my-nlb"'
    );
  });

  it('returns generic system process message for non-reserved port without NLB name', () => {
    expect(getPortConflictMessage(9000)).toBe(
      'Port 9000 is already in use by another process on the system'
    );
  });

  it('prioritises reserved-port message even when NLB name is supplied', () => {
    expect(getPortConflictMessage(443, 'some-nlb')).toBe(
      'Port 443 is reserved by the system and cannot be used for NLB'
    );
  });
});

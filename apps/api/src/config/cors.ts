import type { CorsOptions } from 'cors';

/**
 * Resolve CORS origin for Express.
 *
 * CORS_MODE (or CORS_ORIGIN=auto|*):
 *   auto  — allow any http(s) browser origin (recommended for Docker)
 *   list  — exact match against CORS_ORIGIN comma-separated list (default)
 */

const UI_PORTS = new Set(['8080', '5173', '80', '443', '3001', '']);

export function isCorsAutoMode(): boolean {
  const mode = (process.env.CORS_MODE ?? '').trim().toLowerCase();
  const raw = (process.env.CORS_ORIGIN ?? '').trim();
  return (
    mode === 'auto' ||
    raw === 'auto' ||
    raw === '*' ||
    process.env.CORS_ORIGIN_RELAXED === 'true'
  );
}

function isRelaxedOriginMatch(origin: string, allowed: string[]): boolean {
  try {
    const req = new URL(origin);
    for (const entry of allowed) {
      const base = new URL(entry);
      const reqPort = req.port || (req.protocol === 'https:' ? '443' : '80');
      const basePort = base.port || (base.protocol === 'https:' ? '443' : '80');
      if (req.hostname === base.hostname && UI_PORTS.has(reqPort) && UI_PORTS.has(basePort)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function createCorsOriginResolver(): CorsOptions['origin'] {
  const raw = (process.env.CORS_ORIGIN ?? '').trim();

  if (isCorsAutoMode()) {
    return (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (/^https?:\/\/[^\s/]+(:\d+)?$/i.test(origin)) {
        callback(null, origin);
        return;
      }
      callback(new Error(`CORS: invalid origin format: ${origin}`));
    };
  }

  const allowed = raw
    ? raw.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:8080'];

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowed.includes(origin)) {
      callback(null, true);
      return;
    }

    if (process.env.CORS_ORIGIN_RELAXED === 'true' && isRelaxedOriginMatch(origin, allowed)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS: origin not allowed: ${origin}`));
  };
}

export function describeCorsPolicy(): string {
  if (process.env.DISABLE_CORS === 'true') {
    return 'disabled (proxy-only mode)';
  }
  const mode = (process.env.CORS_MODE ?? 'list').trim();
  const raw = (process.env.CORS_ORIGIN ?? '').trim();
  if (mode === 'auto' || raw === 'auto' || raw === '*') {
    return 'auto (any http/https origin)';
  }
  if (raw) {
    return raw;
  }
  return 'http://localhost:5173, http://localhost:8080 (default)';
}

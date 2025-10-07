/**
 * Log domain types
 */

export interface ParsedLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  type: 'access' | 'error' | 'system';
  source: string;
  message: string;
  domain?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
}

export interface LogFilterOptions {
  limit?: number;
  level?: string;
  type?: string;
  search?: string;
  domain?: string;
}

export interface LogStatistics {
  total: number;
  byLevel: { info: number; warning: number; error: number };
  byType: { access: number; error: number; system: number };
}

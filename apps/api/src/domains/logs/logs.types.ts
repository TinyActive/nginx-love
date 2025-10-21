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
  // ModSecurity specific fields
  ruleId?: string;
  severity?: string;
  tags?: string[];
  uri?: string;
  uniqueId?: string;
  file?: string;
  line?: string;
  data?: string;
  fullMessage?: string; // Store complete log message without truncation
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

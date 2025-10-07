import logger from '../../../utils/logger';
import { ParsedLogEntry } from '../logs.types';

/**
 * Log parser service for nginx access.log, error.log, and modsecurity audit log
 */

/**
 * Parse nginx access log line (combined format)
 * Format: $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
 */
export function parseAccessLogLine(line: string, index: number, domain?: string): ParsedLogEntry | null {
  try {
    // Regex for nginx combined log format
    const regex = /^(\S+) - \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d+) \d+ "([^"]*)" "([^"]*)"/;
    const match = line.match(regex);

    if (!match) return null;

    const [, ip, timeStr, method, path, statusStr] = match;
    const statusCode = parseInt(statusStr);

    // Parse time
    // Format: 29/Mar/2025:14:35:22 +0000
    const timeParts = timeStr.match(/(\d+)\/(\w+)\/(\d+):(\d+):(\d+):(\d+) ([+-]\d+)/);
    let timestamp = new Date().toISOString();

    if (timeParts) {
      const [, day, monthStr, year, hour, min, sec] = timeParts;
      const months: { [key: string]: string } = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
      };
      const month = months[monthStr] || '01';
      timestamp = `${year}-${month}-${day.padStart(2, '0')}T${hour}:${min}:${sec}Z`;
    }

    // Determine level based on status code
    let level: 'info' | 'warning' | 'error' = 'info';
    if (statusCode >= 500) level = 'error';
    else if (statusCode >= 400) level = 'warning';

    return {
      id: `access_${Date.now()}_${index}`,
      timestamp,
      level,
      type: 'access',
      source: 'nginx',
      message: `${method} ${path} ${statusCode}`,
      domain,
      ip,
      method,
      path,
      statusCode
    };
  } catch (error) {
    logger.warn(`Failed to parse access log line: ${line}`);
    return null;
  }
}

/**
 * Parse nginx error log line
 * Format: 2025/03/29 14:35:18 [error] 12345#12345: *1 connect() failed (111: Connection refused)
 */
export function parseErrorLogLine(line: string, index: number): ParsedLogEntry | null {
  try {
    const regex = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\] \d+#\d+: (.+)$/;
    const match = line.match(regex);

    if (!match) return null;

    const [, timeStr, levelStr, message] = match;

    // Parse time: 2025/03/29 14:35:18
    const timestamp = timeStr.replace(/\//g, '-').replace(' ', 'T') + 'Z';

    // Map nginx log levels to our levels
    const levelMap: { [key: string]: 'info' | 'warning' | 'error' } = {
      debug: 'info',
      info: 'info',
      notice: 'info',
      warn: 'warning',
      error: 'error',
      crit: 'error',
      alert: 'error',
      emerg: 'error'
    };
    const level = levelMap[levelStr] || 'error';

    // Extract IP if present
    const ipMatch = message.match(/client: ([\d.]+)/);
    const ip = ipMatch ? ipMatch[1] : undefined;

    return {
      id: `error_${Date.now()}_${index}`,
      timestamp,
      level,
      type: 'error',
      source: 'nginx',
      message: message.substring(0, 200), // Truncate long messages
      ip
    };
  } catch (error) {
    logger.warn(`Failed to parse error log line: ${line}`);
    return null;
  }
}

/**
 * Parse ModSecurity audit log line
 * Format varies, look for key patterns
 */
export function parseModSecLogLine(line: string, index: number): ParsedLogEntry | null {
  try {
    // ModSecurity logs are complex, extract key info
    if (!line.includes('ModSecurity:')) return null;

    // Extract timestamp if present
    let timestamp = new Date().toISOString();
    const timeMatch = line.match(/\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2})/);
    if (timeMatch) {
      const [, timeStr] = timeMatch;
      // Parse: 29/Mar/2025:14:35:22
      const timeParts = timeStr.match(/(\d+)\/(\w+)\/(\d+):(\d+):(\d+):(\d+)/);
      if (timeParts) {
        const [, day, monthStr, year, hour, min, sec] = timeParts;
        const months: { [key: string]: string } = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };
        const month = months[monthStr] || '01';
        timestamp = `${year}-${month}-${day.padStart(2, '0')}T${hour}:${min}:${sec}Z`;
      }
    }

    // Extract message
    const msgMatch = line.match(/\[msg "([^"]+)"\]/);
    const message = msgMatch ? msgMatch[1] : line.substring(0, 200);

    // Extract IP
    const ipMatch = line.match(/\[client ([\d.]+)\]/) || line.match(/\[hostname "([\d.]+)"\]/);
    const ip = ipMatch ? ipMatch[1] : undefined;

    // Extract request info
    const methodMatch = line.match(/"(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS) ([^"]+)"/);
    const method = methodMatch ? methodMatch[1] : undefined;
    const path = methodMatch ? methodMatch[2] : undefined;

    // Determine level
    let level: 'info' | 'warning' | 'error' = 'warning';
    if (line.includes('Access denied') || line.includes('blocked')) {
      level = 'error';
    }

    return {
      id: `modsec_${Date.now()}_${index}`,
      timestamp,
      level,
      type: 'error',
      source: 'modsecurity',
      message: `ModSecurity: ${message}`,
      ip,
      method,
      path,
      statusCode: line.includes('403') ? 403 : undefined
    };
  } catch (error) {
    logger.warn(`Failed to parse ModSecurity log line: ${line}`);
    return null;
  }
}

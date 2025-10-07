/**
 * Timeout and cooldown constants
 */
export const TIMEOUTS = {
  ALERT_COOLDOWN_DEFAULT: 5 * 60 * 1000, // 5 minutes
  ALERT_COOLDOWN_SSL: 24 * 60 * 60 * 1000, // 1 day
  NGINX_RELOAD_WAIT: 500, // 500ms
  NGINX_RESTART_WAIT: 1000, // 1 second
  NGINX_VERIFY_WAIT: 2000, // 2 seconds
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

import { QueryClient } from '@tanstack/react-query';

// Utility functions for route loaders to ensure data is available before rendering

/**
 * Ensure dashboard data is loaded
 */
export async function ensureDashboardData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: ['dashboard', 'detail', 'stats'],
      queryFn: async () => {
        const { dashboardService } = await import('@/services/dashboard.service');
        return dashboardService.getDashboardStats();
      },
      staleTime: 30 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['dashboard', 'list', { period: '24h' }],
      queryFn: async () => {
        const { dashboardService } = await import('@/services/dashboard.service');
        return dashboardService.getSystemMetrics('24h');
      },
      staleTime: 60 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['dashboard', 'list', { limit: 5 }],
      queryFn: async () => {
        const { dashboardService } = await import('@/services/dashboard.service');
        return dashboardService.getRecentAlerts(5);
      },
      staleTime: 15 * 1000,
    }),
  ]);
}

/**
 * Ensure domains data is loaded
 */
export async function ensureDomainsData(queryClient: QueryClient) {
  return queryClient.ensureQueryData({
    queryKey: ['domains', 'list'],
    queryFn: async () => {
      const { domainService } = await import('@/services/domain.service');
      return domainService.getAll();
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Ensure ACL rules data is loaded
 */
export async function ensureAclData(queryClient: QueryClient) {
  return queryClient.ensureQueryData({
    queryKey: ['acl', 'list'],
    queryFn: async () => {
      const { aclService } = await import('@/services/acl.service');
      return aclService.getAll();
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Ensure SSL certificates data is loaded
 */
export async function ensureSSLData(queryClient: QueryClient) {
  return queryClient.ensureQueryData({
    queryKey: ['ssl', 'list'],
    queryFn: async () => {
      const { sslService } = await import('@/services/ssl.service');
      return sslService.getAll();
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Ensure ModSecurity rules data is loaded
 */
export async function ensureModSecData(queryClient: QueryClient, domainId?: string) {
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: ['modsec', 'list', { type: 'crs', domainId }],
      queryFn: async () => {
        const { getCRSRules } = await import('@/services/modsec.service');
        return getCRSRules(domainId);
      },
      staleTime: 2 * 60 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['modsec', 'list', { type: 'custom', domainId }],
      queryFn: async () => {
        const { getModSecRules } = await import('@/services/modsec.service');
        return getModSecRules(domainId);
      },
      staleTime: 2 * 60 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['modsec', 'detail', 'global-settings'],
      queryFn: async () => {
        const { getGlobalModSecSettings } = await import('@/services/modsec.service');
        return getGlobalModSecSettings();
      },
      staleTime: 5 * 60 * 1000,
    }),
  ]);
}

/**
 * Ensure alerts data is loaded
 */
export async function ensureAlertsData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: ['notification-channels', 'list'],
      queryFn: async () => {
        const { notificationChannelService } = await import('@/services/alerts.service');
        return notificationChannelService.getAll();
      },
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['alert-rules', 'list'],
      queryFn: async () => {
        const { alertRuleService } = await import('@/services/alerts.service');
        return alertRuleService.getAll();
      },
      staleTime: 3 * 60 * 1000,
    }),
  ]);
}

/**
 * Ensure logs data is loaded
 */
export async function ensureLogsData(queryClient: QueryClient, params?: any) {
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: ['logs', 'list', params || {}],
      queryFn: async () => {
        const { getLogs } = await import('@/services/logs.service');
        return getLogs(params);
      },
      staleTime: 30 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['logs', 'detail', 'statistics'],
      queryFn: async () => {
        const { getLogStatistics } = await import('@/services/logs.service');
        return getLogStatistics();
      },
      staleTime: 60 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['logs', 'detail', 'available-domains'],
      queryFn: async () => {
        const { getAvailableDomains } = await import('@/services/logs.service');
        return getAvailableDomains();
      },
      staleTime: 5 * 60 * 1000,
    }),
  ]);
}

/**
 * Ensure user data is loaded
 */
export async function ensureUsersData(queryClient: QueryClient, params?: any) {
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: ['users', 'list', params || {}],
      queryFn: async () => {
        const userService = (await import('@/services/user.service')).default;
        return userService.getAll(params);
      },
      staleTime: 2 * 60 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['users', 'detail', 'stats'],
      queryFn: async () => {
        const userService = (await import('@/services/user.service')).default;
        return userService.getStats();
      },
      staleTime: 5 * 60 * 1000,
    }),
  ]);
}

/**
 * Ensure performance data is loaded
 */
export async function ensurePerformanceData(
  queryClient: QueryClient,
  domain: string = 'all',
  timeRange: string = '1h'
) {
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: ['performance', 'list', { domain, timeRange }],
      queryFn: async () => {
        const { performanceService } = await import('@/services/performance.service');
        return performanceService.getMetrics(domain, timeRange);
      },
      staleTime: 30 * 1000,
    }),
    queryClient.ensureQueryData({
      queryKey: ['performance', 'list', { domain, timeRange, type: 'stats' }],
      queryFn: async () => {
        const { performanceService } = await import('@/services/performance.service');
        return performanceService.getStats(domain, timeRange);
      },
      staleTime: 60 * 1000,
    }),
  ]);
}
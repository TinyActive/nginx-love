import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { dashboardAnalyticsService } from '@/services/dashboard-analytics.service';
import { createQueryKeys } from '@/lib/query-client';

// Create query keys for dashboard analytics
export const dashboardAnalyticsQueryKeys = createQueryKeys('dashboardAnalytics');

// Query options for dashboard analytics
export const dashboardAnalyticsQueryOptions = {
  // Get request trend (auto-refresh every 5 seconds)
  requestTrend: (intervalSeconds: number = 5) => ({
    queryKey: dashboardAnalyticsQueryKeys.list({ interval: intervalSeconds }),
    queryFn: () => dashboardAnalyticsService.getRequestTrend(intervalSeconds),
    refetchInterval: 5 * 1000, // Auto-refresh every 5 seconds
    staleTime: 3 * 1000, // Consider stale after 3 seconds
  }),

  // Get slow requests
  slowRequests: (limit: number = 10) => ({
    queryKey: dashboardAnalyticsQueryKeys.list({ type: 'slow', limit }),
    queryFn: () => dashboardAnalyticsService.getSlowRequests(limit),
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  }),

  // Get latest attack statistics
  latestAttacks: (limit: number = 5) => ({
    queryKey: dashboardAnalyticsQueryKeys.list({ type: 'attacks', limit }),
    queryFn: () => dashboardAnalyticsService.getLatestAttackStats(limit),
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
  }),

  // Get latest security news/events
  latestNews: (limit: number = 20) => ({
    queryKey: dashboardAnalyticsQueryKeys.list({ type: 'news', limit }),
    queryFn: () => dashboardAnalyticsService.getLatestNews(limit),
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
  }),

  // Get request analytics (top IPs by period)
  requestAnalytics: (period: 'day' | 'week' | 'month' = 'day') => ({
    queryKey: dashboardAnalyticsQueryKeys.list({ type: 'ipAnalytics', period }),
    queryFn: () => dashboardAnalyticsService.getRequestAnalytics(period),
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  }),

  // Get attack vs normal request ratio
  attackRatio: () => ({
    queryKey: dashboardAnalyticsQueryKeys.detail('attackRatio'),
    queryFn: dashboardAnalyticsService.getAttackRatio,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  }),

  // Get complete dashboard analytics
  complete: () => ({
    queryKey: dashboardAnalyticsQueryKeys.detail('complete'),
    queryFn: dashboardAnalyticsService.getDashboardAnalytics,
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
  }),
};

// Custom hooks for dashboard analytics operations
export const useRequestTrend = (intervalSeconds: number = 5) => {
  return useQuery(dashboardAnalyticsQueryOptions.requestTrend(intervalSeconds));
};

export const useSlowRequests = (limit: number = 10) => {
  return useQuery(dashboardAnalyticsQueryOptions.slowRequests(limit));
};

export const useLatestAttackStats = (limit: number = 5) => {
  return useQuery(dashboardAnalyticsQueryOptions.latestAttacks(limit));
};

export const useLatestNews = (limit: number = 20) => {
  return useQuery(dashboardAnalyticsQueryOptions.latestNews(limit));
};

export const useRequestAnalytics = (period: 'day' | 'week' | 'month' = 'day') => {
  return useQuery(dashboardAnalyticsQueryOptions.requestAnalytics(period));
};

export const useAttackRatio = () => {
  return useQuery(dashboardAnalyticsQueryOptions.attackRatio());
};

export const useDashboardAnalytics = () => {
  return useQuery(dashboardAnalyticsQueryOptions.complete());
};

// Suspense hooks for deferred loading pattern
export const useSuspenseRequestTrend = (intervalSeconds: number = 5) => {
  return useSuspenseQuery(dashboardAnalyticsQueryOptions.requestTrend(intervalSeconds));
};

export const useSuspenseSlowRequests = (limit: number = 10) => {
  return useSuspenseQuery(dashboardAnalyticsQueryOptions.slowRequests(limit));
};

export const useSuspenseLatestAttackStats = (limit: number = 5) => {
  return useSuspenseQuery(dashboardAnalyticsQueryOptions.latestAttacks(limit));
};

export const useSuspenseLatestNews = (limit: number = 20) => {
  return useSuspenseQuery(dashboardAnalyticsQueryOptions.latestNews(limit));
};

export const useSuspenseRequestAnalytics = (period: 'day' | 'week' | 'month' = 'day') => {
  return useSuspenseQuery(dashboardAnalyticsQueryOptions.requestAnalytics(period));
};

export const useSuspenseAttackRatio = () => {
  return useSuspenseQuery(dashboardAnalyticsQueryOptions.attackRatio());
};

export const useSuspenseDashboardAnalytics = () => {
  return useSuspenseQuery(dashboardAnalyticsQueryOptions.complete());
};

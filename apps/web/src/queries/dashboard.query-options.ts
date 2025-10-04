import { useQuery, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { createQueryKeys } from '@/lib/query-client';
import type { DashboardStats, SystemMetrics, DashboardAlert } from '@/services/dashboard.service';

// Create query keys for dashboard operations
export const dashboardQueryKeys = createQueryKeys('dashboard');

// Query options for dashboard
export const dashboardQueryOptions = {
  // Get dashboard statistics
  stats: {
    queryKey: dashboardQueryKeys.detail('stats'),
    queryFn: dashboardService.getDashboardStats,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  },
  
  // Get system metrics
  systemMetrics: (period: '24h' | '7d' | '30d' = '24h') => ({
    queryKey: dashboardQueryKeys.list({ period }),
    queryFn: () => dashboardService.getSystemMetrics(period),
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  }),
  
  // Get recent alerts
  recentAlerts: (limit: number = 5) => ({
    queryKey: dashboardQueryKeys.list({ limit }),
    queryFn: () => dashboardService.getRecentAlerts(limit),
    refetchInterval: 15 * 1000, // Auto-refresh every 15 seconds
  }),
};

// Custom hooks for dashboard operations
export const useDashboardStats = () => {
  return useQuery(dashboardQueryOptions.stats);
};

export const useSystemMetrics = (period: '24h' | '7d' | '30d' = '24h') => {
  return useQuery(dashboardQueryOptions.systemMetrics(period));
};

export const useRecentAlerts = (limit: number = 5) => {
  return useQuery(dashboardQueryOptions.recentAlerts(limit));
};

// Suspense hooks for deferred loading pattern
export const useSuspenseDashboardStats = () => {
  return useSuspenseQuery(dashboardQueryOptions.stats);
};

export const useSuspenseSystemMetrics = (period: '24h' | '7d' | '30d' = '24h') => {
  return useSuspenseQuery(dashboardQueryOptions.systemMetrics(period));
};

export const useSuspenseRecentAlerts = (limit: number = 5) => {
  return useSuspenseQuery(dashboardQueryOptions.recentAlerts(limit));
};

// Hook to preload all dashboard data
export const usePreloadDashboardData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    // Prefetch all dashboard data
    queryClient.prefetchQuery(dashboardQueryOptions.stats);
    queryClient.prefetchQuery(dashboardQueryOptions.systemMetrics('24h'));
    queryClient.prefetchQuery(dashboardQueryOptions.recentAlerts(5));
  };
};

// Hook to ensure dashboard data is loaded (useful for route loaders)
export const useEnsureDashboardData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    // Ensure all dashboard data is available
    return Promise.all([
      queryClient.ensureQueryData(dashboardQueryOptions.stats),
      queryClient.ensureQueryData(dashboardQueryOptions.systemMetrics('24h')),
      queryClient.ensureQueryData(dashboardQueryOptions.recentAlerts(5)),
    ]);
  };
};
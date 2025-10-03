import React from 'react';
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performanceService } from '@/services/performance.service';
import { createQueryKeys } from '@/lib/query-client';
import type { PerformanceMetric } from '@/types';

// Create query keys for performance operations
export const performanceQueryKeys = createQueryKeys('performance');

// Query options for performance metrics
export const performanceQueryOptions = {
  // Get performance metrics
  metrics: (domain: string = 'all', timeRange: string = '1h') => ({
    queryKey: performanceQueryKeys.list({ domain, timeRange }),
    queryFn: () => performanceService.getMetrics(domain, timeRange),
  }),
  
  // Get performance statistics
  stats: (domain: string = 'all', timeRange: string = '1h') => ({
    queryKey: performanceQueryKeys.list({ domain, timeRange, type: 'stats' }),
    queryFn: () => performanceService.getStats(domain, timeRange),
  }),
  
  // Get historical metrics
  history: (domain: string = 'all', limit: number = 100) => ({
    queryKey: performanceQueryKeys.list({ domain, limit, type: 'history' }),
    queryFn: () => performanceService.getHistory(domain, limit),
  }),
};

// Mutation options for performance metrics
export const performanceMutationOptions = {
  // Cleanup old metrics
  cleanup: {
    mutationFn: (days: number = 7) => performanceService.cleanup(days),
    onSuccess: (data: { deletedCount: number }) => {
      console.log(`Successfully cleaned up ${data.deletedCount} old metrics`);
    },
    onError: (error: any) => {
      console.error('Performance metrics cleanup failed:', error);
    },
  },
};

// Custom hooks for performance operations
export const usePerformanceMetrics = (domain: string = 'all', timeRange: string = '1h') => {
  return useQuery(performanceQueryOptions.metrics(domain, timeRange));
};

export const usePerformanceStats = (domain: string = 'all', timeRange: string = '1h') => {
  return useQuery(performanceQueryOptions.stats(domain, timeRange));
};

export const usePerformanceHistory = (domain: string = 'all', limit: number = 100) => {
  return useQuery(performanceQueryOptions.history(domain, limit));
};

// Suspense hooks for deferred loading pattern
export const useSuspensePerformanceStats = (domain: string = 'all', timeRange: string = '1h') => {
  const result = useSuspenseQuery(performanceQueryOptions.stats(domain, timeRange));
  
  // Add error logging in a useEffect
  React.useEffect(() => {
    if (result.error) {
      console.error('[Performance Query] Error fetching stats:', result.error);
    }
  }, [result.error]);
  
  return result;
};

export const useSuspensePerformanceMetrics = (domain: string = 'all', timeRange: string = '1h') => {
  const result = useSuspenseQuery(performanceQueryOptions.metrics(domain, timeRange));
  
  // Add error logging in a useEffect
  React.useEffect(() => {
    if (result.error) {
      console.error('[Performance Query] Error fetching metrics:', result.error);
    }
  }, [result.error]);
  
  return result;
};

export const useCleanupPerformanceMetrics = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...performanceMutationOptions.cleanup,
    onSuccess: (data: { deletedCount: number }) => {
      performanceMutationOptions.cleanup.onSuccess?.(data);
      // Invalidate all performance queries to refresh
      queryClient.invalidateQueries({ queryKey: performanceQueryKeys.all });
    },
  });
};

// Hook to preload performance data
export const usePreloadPerformanceData = (domain: string = 'all', timeRange: string = '1h') => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery(performanceQueryOptions.metrics(domain, timeRange));
    queryClient.prefetchQuery(performanceQueryOptions.stats(domain, timeRange));
    queryClient.prefetchQuery(performanceQueryOptions.history(domain, 100));
  };
};

// Hook to ensure performance data is loaded (useful for route loaders)
export const useEnsurePerformanceData = (domain: string = 'all', timeRange: string = '1h') => {
  const queryClient = useQueryClient();
  
  return () => {
    return Promise.all([
      queryClient.ensureQueryData(performanceQueryOptions.metrics(domain, timeRange)),
      queryClient.ensureQueryData(performanceQueryOptions.stats(domain, timeRange)),
      queryClient.ensureQueryData(performanceQueryOptions.history(domain, 100)),
    ]);
  };
};

// Hook to refresh performance data
export const useRefreshPerformanceData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    // Invalidate all performance queries to trigger a refresh
    queryClient.invalidateQueries({ queryKey: performanceQueryKeys.all });
  };
};
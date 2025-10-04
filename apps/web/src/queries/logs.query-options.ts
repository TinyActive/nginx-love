import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogs, getLogStatistics, getAvailableDomains, downloadLogs } from '@/services/logs.service';
import { createQueryKeys } from '@/lib/query-client';
import type { GetLogsParams, PaginatedLogsResponse, LogStatistics, DomainInfo } from '@/services/logs.service';

// Create query keys for logs operations
export const logsQueryKeys = createQueryKeys('logs');

// Query options for logs
export const logsQueryOptions = {
  // Get logs with optional filtering and pagination
  all: (params?: GetLogsParams) => ({
    queryKey: logsQueryKeys.list(params || {}),
    queryFn: () => getLogs(params),
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  }),
  
  // Get log statistics
  statistics: {
    queryKey: logsQueryKeys.detail('statistics'),
    queryFn: getLogStatistics,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  },
  
  // Get available domains
  availableDomains: {
    queryKey: logsQueryKeys.detail('available-domains'),
    queryFn: getAvailableDomains,
  },
};

// Mutation options for logs
export const logsMutationOptions = {
  // Download logs
  download: {
    mutationFn: (params?: GetLogsParams) => downloadLogs(params),
    onSuccess: () => {
      console.log('Logs downloaded successfully');
    },
    onError: (error: any) => {
      console.error('Logs download failed:', error);
    },
  },
};

// Custom hooks for logs operations
export const useLogs = (params?: GetLogsParams) => {
  return useQuery(logsQueryOptions.all(params));
};

export const useLogStatistics = () => {
  return useQuery(logsQueryOptions.statistics);
};

export const useAvailableDomains = () => {
  return useQuery(logsQueryOptions.availableDomains);
};

export const useDownloadLogs = () => {
  return useMutation(logsMutationOptions.download);
};

// Suspense hooks for deferred loading pattern
export const useSuspenseLogStatistics = () => {
  return useSuspenseQuery(logsQueryOptions.statistics);
};

export const useSuspenseAvailableDomains = () => {
  return useSuspenseQuery(logsQueryOptions.availableDomains);
};

export const useSuspenseLogs = (params?: GetLogsParams) => {
  return useSuspenseQuery(logsQueryOptions.all(params));
};

// Hook to preload logs data
export const usePreloadLogsData = () => {
  const queryClient = useQueryClient();
  
  return (params?: GetLogsParams) => {
    queryClient.prefetchQuery(logsQueryOptions.all(params));
    queryClient.prefetchQuery(logsQueryOptions.statistics);
    queryClient.prefetchQuery(logsQueryOptions.availableDomains);
  };
};

// Hook to ensure logs data is loaded (useful for route loaders)
export const useEnsureLogsData = () => {
  const queryClient = useQueryClient();
  
  return (params?: GetLogsParams) => {
    return Promise.all([
      queryClient.ensureQueryData(logsQueryOptions.all(params)),
      queryClient.ensureQueryData(logsQueryOptions.statistics),
      queryClient.ensureQueryData(logsQueryOptions.availableDomains),
    ]);
  };
};

// Hook to refresh logs data
export const useRefreshLogsData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    // Invalidate all logs queries to trigger a refresh
    queryClient.invalidateQueries({ queryKey: logsQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: logsQueryKeys.details() });
  };
};
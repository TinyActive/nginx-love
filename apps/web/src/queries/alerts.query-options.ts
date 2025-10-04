import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { notificationChannelService, alertRuleService } from '@/services/alerts.service';
import { createQueryKeys } from '@/lib/query-client';
import type { NotificationChannel, AlertRule } from '@/types';

// Create query keys for alerts operations
export const notificationChannelQueryKeys = createQueryKeys('notification-channels');
export const alertRuleQueryKeys = createQueryKeys('alert-rules');

// Query options for notification channels
export const notificationChannelQueryOptions = {
  // Get all notification channels
  all: {
    queryKey: notificationChannelQueryKeys.lists(),
    queryFn: notificationChannelService.getAll,
  },
  
  // Get notification channel by ID
  byId: (id: string) => ({
    queryKey: notificationChannelQueryKeys.detail(id),
    queryFn: () => notificationChannelService.getById(id),
  }),
};

// Query options for alert rules
export const alertRuleQueryOptions = {
  // Get all alert rules
  all: {
    queryKey: alertRuleQueryKeys.lists(),
    queryFn: alertRuleService.getAll,
  },
  
  // Get alert rule by ID
  byId: (id: string) => ({
    queryKey: alertRuleQueryKeys.detail(id),
    queryFn: () => alertRuleService.getById(id),
  }),
};

// Suspense query options for notification channels
export const notificationChannelSuspenseQueryOptions = {
  // Get all notification channels
  all: {
    queryKey: notificationChannelQueryKeys.lists(),
    queryFn: notificationChannelService.getAll,
  },
  
  // Get notification channel by ID
  byId: (id: string) => ({
    queryKey: notificationChannelQueryKeys.detail(id),
    queryFn: () => notificationChannelService.getById(id),
  }),
};

// Suspense query options for alert rules
export const alertRuleSuspenseQueryOptions = {
  // Get all alert rules
  all: {
    queryKey: alertRuleQueryKeys.lists(),
    queryFn: alertRuleService.getAll,
  },
  
  // Get alert rule by ID
  byId: (id: string) => ({
    queryKey: alertRuleQueryKeys.detail(id),
    queryFn: () => alertRuleService.getById(id),
  }),
};

// Mutation options for notification channels
export const notificationChannelMutationOptions = {
  // Create notification channel
  create: {
    mutationFn: (data: Omit<NotificationChannel, 'id'>) => notificationChannelService.create(data),
    onSuccess: (data: NotificationChannel) => {
      console.log('Notification channel created successfully');
    },
    onError: (error: any) => {
      console.error('Notification channel creation failed:', error);
    },
  },
  
  // Update notification channel
  update: {
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationChannel> }) => 
      notificationChannelService.update(id, data),
    onSuccess: (data: NotificationChannel) => {
      console.log('Notification channel updated successfully');
    },
    onError: (error: any) => {
      console.error('Notification channel update failed:', error);
    },
  },
  
  // Delete notification channel
  delete: {
    mutationFn: (id: string) => notificationChannelService.delete(id),
    onSuccess: () => {
      console.log('Notification channel deleted successfully');
    },
    onError: (error: any) => {
      console.error('Notification channel deletion failed:', error);
    },
  },
  
  // Test notification channel
  test: {
    mutationFn: (id: string) => notificationChannelService.test(id),
    onSuccess: () => {
      console.log('Notification channel test successful');
    },
    onError: (error: any) => {
      console.error('Notification channel test failed:', error);
    },
  },
};

// Mutation options for alert rules
export const alertRuleMutationOptions = {
  // Create alert rule
  create: {
    mutationFn: (data: Omit<AlertRule, 'id'>) => alertRuleService.create(data),
    onSuccess: (data: AlertRule) => {
      console.log('Alert rule created successfully');
    },
    onError: (error: any) => {
      console.error('Alert rule creation failed:', error);
    },
  },
  
  // Update alert rule
  update: {
    mutationFn: ({ id, data }: { id: string; data: Partial<AlertRule> }) => 
      alertRuleService.update(id, data),
    onSuccess: (data: AlertRule) => {
      console.log('Alert rule updated successfully');
    },
    onError: (error: any) => {
      console.error('Alert rule update failed:', error);
    },
  },
  
  // Delete alert rule
  delete: {
    mutationFn: (id: string) => alertRuleService.delete(id),
    onSuccess: () => {
      console.log('Alert rule deleted successfully');
    },
    onError: (error: any) => {
      console.error('Alert rule deletion failed:', error);
    },
  },
};

// Custom hooks for notification channels
export const useNotificationChannels = () => {
  return useQuery(notificationChannelQueryOptions.all);
};

export const useNotificationChannel = (id: string) => {
  return useQuery(notificationChannelQueryOptions.byId(id));
};

export const useCreateNotificationChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...notificationChannelMutationOptions.create,
    onSuccess: (data: NotificationChannel) => {
      notificationChannelMutationOptions.create.onSuccess?.(data);
      // Invalidate notification channels list to refresh
      queryClient.invalidateQueries({ queryKey: notificationChannelQueryKeys.lists() });
    },
  });
};

export const useUpdateNotificationChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...notificationChannelMutationOptions.update,
    onSuccess: (data: NotificationChannel, { id }) => {
      notificationChannelMutationOptions.update.onSuccess?.(data);
      // Update the specific notification channel in cache
      queryClient.setQueryData(notificationChannelQueryKeys.detail(id), data);
      // Invalidate notification channels list to refresh
      queryClient.invalidateQueries({ queryKey: notificationChannelQueryKeys.lists() });
    },
  });
};

export const useDeleteNotificationChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...notificationChannelMutationOptions.delete,
    onSuccess: (_, id) => {
      notificationChannelMutationOptions.delete.onSuccess?.();
      // Remove the specific notification channel from cache
      queryClient.removeQueries({ queryKey: notificationChannelQueryKeys.detail(id) });
      // Invalidate notification channels list to refresh
      queryClient.invalidateQueries({ queryKey: notificationChannelQueryKeys.lists() });
    },
  });
};

export const useTestNotificationChannel = () => {
  return useMutation(notificationChannelMutationOptions.test);
};

// Custom hooks for alert rules
export const useAlertRules = () => {
  return useQuery(alertRuleQueryOptions.all);
};

export const useAlertRule = (id: string) => {
  return useQuery(alertRuleQueryOptions.byId(id));
};

// Suspense hooks for deferred loading pattern
export const useSuspenseNotificationChannels = () => {
  return useSuspenseQuery(notificationChannelSuspenseQueryOptions.all);
};

export const useSuspenseNotificationChannel = (id: string) => {
  return useSuspenseQuery(notificationChannelSuspenseQueryOptions.byId(id));
};

export const useSuspenseAlertRules = () => {
  return useSuspenseQuery(alertRuleSuspenseQueryOptions.all);
};

export const useSuspenseAlertRule = (id: string) => {
  return useSuspenseQuery(alertRuleSuspenseQueryOptions.byId(id));
};

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...alertRuleMutationOptions.create,
    onSuccess: (data: AlertRule) => {
      alertRuleMutationOptions.create.onSuccess?.(data);
      // Invalidate alert rules list to refresh
      queryClient.invalidateQueries({ queryKey: alertRuleQueryKeys.lists() });
    },
  });
};

export const useUpdateAlertRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...alertRuleMutationOptions.update,
    onSuccess: (data: AlertRule, { id }) => {
      alertRuleMutationOptions.update.onSuccess?.(data);
      // Update the specific alert rule in cache
      queryClient.setQueryData(alertRuleQueryKeys.detail(id), data);
      // Invalidate alert rules list to refresh
      queryClient.invalidateQueries({ queryKey: alertRuleQueryKeys.lists() });
    },
  });
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...alertRuleMutationOptions.delete,
    onSuccess: (_, id) => {
      alertRuleMutationOptions.delete.onSuccess?.();
      // Remove the specific alert rule from cache
      queryClient.removeQueries({ queryKey: alertRuleQueryKeys.detail(id) });
      // Invalidate alert rules list to refresh
      queryClient.invalidateQueries({ queryKey: alertRuleQueryKeys.lists() });
    },
  });
};

// Hooks to preload data
export const usePreloadAlertsData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery(notificationChannelQueryOptions.all);
    queryClient.prefetchQuery(alertRuleQueryOptions.all);
  };
};

// Hooks to ensure data is loaded (useful for route loaders)
export const useEnsureAlertsData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    return Promise.all([
      queryClient.ensureQueryData(notificationChannelQueryOptions.all),
      queryClient.ensureQueryData(alertRuleQueryOptions.all),
    ]);
  };
};
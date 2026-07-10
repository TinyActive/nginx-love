import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { botManagerService, BotProfile, BotRule } from '@/services/bot-manager.service';

export const botProfilesQueryOptions = (params?: { page?: number; limit?: number; search?: string }) =>
  queryOptions({
    queryKey: ['bot-manager', 'profiles', params],
    queryFn: async () => botManagerService.getProfiles(params),
  });

export const botProfileQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['bot-manager', 'profiles', id],
    queryFn: () => botManagerService.getProfile(id),
    enabled: !!id,
  });

export const globalBotRulesQueryOptions = () =>
  queryOptions({
    queryKey: ['bot-manager', 'global-rules'],
    queryFn: () => botManagerService.getGlobalRules(),
  });

export const fingerprintLibraryQueryOptions = (params?: { isBuiltin?: boolean; search?: string }) =>
  queryOptions({
    queryKey: ['bot-manager', 'fingerprints', params],
    queryFn: () => botManagerService.getFingerprints(params),
  });

export const botAnalyticsQueryOptions = (params?: { domain?: string; limit?: number }) =>
  queryOptions({
    queryKey: ['bot-manager', 'analytics', params],
    queryFn: () => botManagerService.getAnalytics(params),
  });

export function useCreateBotProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botManagerService.createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
    },
  });
}

export function useUpdateBotProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BotProfile> }) =>
      botManagerService.updateProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
    },
  });
}

export function useDeleteBotProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botManagerService.deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
    },
  });
}

export function useToggleBotProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botManagerService.toggleProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
    },
  });
}

export function useCreateBotRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      data,
      isGlobal,
    }: {
      profileId?: string;
      data: Omit<BotRule, 'id' | 'profileId' | 'isBuiltin'>;
      isGlobal?: boolean;
    }) =>
      isGlobal
        ? botManagerService.createGlobalRule(data)
        : botManagerService.createProfileRule(profileId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
    },
  });
}

export function useDeleteBotRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botManagerService.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
    },
  });
}

export function useToggleBotRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botManagerService.toggleRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
    },
  });
}

export function useApplyBotRules() {
  return useMutation({
    mutationFn: botManagerService.applyRules,
  });
}

export function useAssignBotProfileDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, domainId }: { profileId: string; domainId: string }) =>
      botManagerService.assignDomain(profileId, domainId),
    onSuccess: (_data, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
      queryClient.invalidateQueries({ queryKey: ['bot-manager', 'profiles', profileId] });
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
  });
}

export function useRemoveBotProfileDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, domainId }: { profileId: string; domainId: string }) =>
      botManagerService.removeDomain(profileId, domainId),
    onSuccess: (_data, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager'] });
      queryClient.invalidateQueries({ queryKey: ['bot-manager', 'profiles', profileId] });
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
  });
}

export function useDiscoverFingerprints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botManagerService.discoverFingerprints,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-manager', 'analytics'] });
    },
  });
}

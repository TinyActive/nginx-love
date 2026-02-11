import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dnsService, adguardDnsService, cloudflareDnsService } from '@/services/dns.service';
import type { DnsProviderConfig, AdGuardConfig, CloudflareConfig, AdGuardRewrite } from '@/services/dns.service';
import { createQueryKeys } from '@/lib/query-client';

// Create query keys for DNS operations
export const dnsQueryKeys = createQueryKeys('dns');
export const adguardQueryKeys = createQueryKeys('adguard-dns');
export const cloudflareQueryKeys = createQueryKeys('cloudflare-dns');

// Query options for unified DNS records
export const dnsQueryOptions = {
  all: (configs: DnsProviderConfig[]) => ({
    queryKey: [...dnsQueryKeys.lists(), configs],
    queryFn: () => dnsService.getAllRecords(configs),
    enabled: configs.length > 0,
  }),
};

// Query options for AdGuard rewrites
export const adguardQueryOptions = {
  rewrites: (config: AdGuardConfig | null) => ({
    queryKey: [...adguardQueryKeys.lists(), config?.baseUrl],
    queryFn: () => adguardDnsService.getRewrites(config!),
    enabled: !!config,
  }),
};

// Query options for Cloudflare records
export const cloudflareQueryOptions = {
  records: (config: CloudflareConfig | null) => ({
    queryKey: [...cloudflareQueryKeys.lists(), config?.zoneId],
    queryFn: () => cloudflareDnsService.getRecords(config!),
    enabled: !!config,
  }),
};

// Custom hooks
export const useUnifiedDnsRecords = (configs: DnsProviderConfig[]) => {
  return useQuery(dnsQueryOptions.all(configs));
};

export const useAdGuardRewrites = (config: AdGuardConfig | null) => {
  return useQuery(adguardQueryOptions.rewrites(config));
};

export const useCloudflareRecords = (config: CloudflareConfig | null) => {
  return useQuery(cloudflareQueryOptions.records(config));
};

export const useTestDnsConnection = () => {
  return useMutation({
    mutationFn: (config: DnsProviderConfig) => dnsService.testConnection(config),
  });
};

export const useAddAdGuardRewrite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ config, rewrite }: { config: AdGuardConfig; rewrite: AdGuardRewrite }) =>
      adguardDnsService.addRewrite(config, rewrite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adguardQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dnsQueryKeys.lists() });
    },
  });
};

export const useUpdateAdGuardRewrite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      config,
      oldRewrite,
      newRewrite,
    }: {
      config: AdGuardConfig;
      oldRewrite: AdGuardRewrite;
      newRewrite: AdGuardRewrite;
    }) => adguardDnsService.updateRewrite(config, oldRewrite, newRewrite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adguardQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dnsQueryKeys.lists() });
    },
  });
};

export const useDeleteAdGuardRewrite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ config, rewrite }: { config: AdGuardConfig; rewrite: AdGuardRewrite }) =>
      adguardDnsService.deleteRewrite(config, rewrite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adguardQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dnsQueryKeys.lists() });
    },
  });
};

export const useCreateCloudflareRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      config,
      record,
    }: {
      config: CloudflareConfig;
      record: { type: string; name: string; content: string; ttl?: number; proxied?: boolean; comment?: string };
    }) => cloudflareDnsService.createRecord(config, record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudflareQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dnsQueryKeys.lists() });
    },
  });
};

export const useUpdateCloudflareRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      config,
      recordId,
      record,
    }: {
      config: CloudflareConfig;
      recordId: string;
      record: { type?: string; name?: string; content?: string; ttl?: number; proxied?: boolean; comment?: string };
    }) => cloudflareDnsService.updateRecord(config, recordId, record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudflareQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dnsQueryKeys.lists() });
    },
  });
};

export const useDeleteCloudflareRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ config, recordId }: { config: CloudflareConfig; recordId: string }) =>
      cloudflareDnsService.deleteRecord(config, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudflareQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dnsQueryKeys.lists() });
    },
  });
};

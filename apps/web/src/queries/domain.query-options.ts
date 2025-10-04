import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { domainService } from '@/services/domain.service';
import { createQueryKeys } from '@/lib/query-client';
import type { CreateDomainRequest, UpdateDomainRequest } from '@/services/domain.service';
import type { Domain } from '@/types';

// Create query keys for domain operations
export const domainQueryKeys = createQueryKeys('domains');

// Query options for domains
export const domainQueryOptions = {
  // Get all domains with pagination and search
  all: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sslEnabled?: boolean;
    modsecEnabled?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => ({
    queryKey: [...domainQueryKeys.lists(), params],
    queryFn: () => domainService.getAll(params),
  }),
  
  // Get domain by ID
  byId: (id: string) => ({
    queryKey: domainQueryKeys.detail(id),
    queryFn: () => domainService.getById(id),
  }),
  
  // Get installation status
  installationStatus: {
    queryKey: ['system', 'installation-status'],
    queryFn: domainService.getInstallationStatus,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  },
};

// Mutation options for domains
export const domainMutationOptions = {
  // Create domain
  create: {
    mutationFn: (data: CreateDomainRequest) => domainService.create(data),
    onSuccess: (data: Domain) => {
      console.log('Domain created successfully');
    },
    onError: (error: any) => {
      console.error('Domain creation failed:', error);
    },
  },
  
  // Update domain
  update: {
    mutationFn: ({ id, data }: { id: string; data: UpdateDomainRequest }) =>
      domainService.update(id, data),
    onSuccess: (data: Domain) => {
      console.log('Domain updated successfully');
    },
    onError: (error: any) => {
      console.error('Domain update failed:', error);
    },
  },
  
  // Delete domain
  delete: {
    mutationFn: (id: string) => domainService.delete(id),
    onSuccess: () => {
      console.log('Domain deleted successfully');
    },
    onError: (error: any) => {
      console.error('Domain deletion failed:', error);
    },
  },
  
  // Toggle SSL
  toggleSSL: {
    mutationFn: ({ id, sslEnabled }: { id: string; sslEnabled: boolean }) =>
      domainService.toggleSSL(id, sslEnabled),
    onSuccess: (data: Domain) => {
      console.log('SSL status toggled successfully');
    },
    onError: (error: any) => {
      console.error('SSL toggle failed:', error);
    },
  },
  
  // Reload Nginx
  reloadNginx: {
    mutationFn: domainService.reloadNginx,
    onSuccess: () => {
      console.log('Nginx configuration reloaded successfully');
    },
    onError: (error: any) => {
      console.error('Nginx reload failed:', error);
    },
  },
};

// Custom hooks for domain operations
export const useDomains = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sslEnabled?: boolean;
  modsecEnabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  return useQuery(domainQueryOptions.all(params));
};

export const useDomain = (id: string) => {
  return useQuery(domainQueryOptions.byId(id));
};

export const useInstallationStatus = () => {
  return useQuery(domainQueryOptions.installationStatus);
};

// Suspense hooks for deferred loading pattern
export const useSuspenseDomains = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sslEnabled?: boolean;
  modsecEnabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  return useSuspenseQuery(domainQueryOptions.all(params));
};

export const useSuspenseDomain = (id: string) => {
  return useSuspenseQuery(domainQueryOptions.byId(id));
};

export const useSuspenseInstallationStatus = () => {
  return useSuspenseQuery(domainQueryOptions.installationStatus);
};

export const useCreateDomain = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...domainMutationOptions.create,
    onSuccess: (data: Domain) => {
      domainMutationOptions.create.onSuccess?.(data);
      // Invalidate domains list to refresh
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.lists() });
    },
  });
};

export const useUpdateDomain = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...domainMutationOptions.update,
    onSuccess: (data: Domain, { id }) => {
      domainMutationOptions.update.onSuccess?.(data);
      // Update the specific domain in cache
      queryClient.setQueryData(domainQueryKeys.detail(id), data);
      // Invalidate domains list to refresh
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.lists() });
    },
  });
};

export const useDeleteDomain = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...domainMutationOptions.delete,
    onSuccess: (_, id) => {
      domainMutationOptions.delete.onSuccess?.();
      // Remove the specific domain from cache
      queryClient.removeQueries({ queryKey: domainQueryKeys.detail(id) });
      // Invalidate domains list to refresh
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.lists() });
    },
  });
};

export const useToggleDomainSSL = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...domainMutationOptions.toggleSSL,
    onSuccess: (data: Domain, { id }) => {
      domainMutationOptions.toggleSSL.onSuccess?.(data);
      // Update the specific domain in cache
      queryClient.setQueryData(domainQueryKeys.detail(id), data);
      // Invalidate domains list to refresh
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.lists() });
    },
  });
};

export const useReloadNginx = () => {
  return useMutation(domainMutationOptions.reloadNginx);
};

// Hook to preload domains data
export const usePreloadDomains = () => {
  const queryClient = useQueryClient();
  
  return (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sslEnabled?: boolean;
    modsecEnabled?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    queryClient.prefetchQuery(domainQueryOptions.all(params));
  };
};

// Hook to ensure domains data is loaded (useful for route loaders)
export const useEnsureDomains = () => {
  const queryClient = useQueryClient();
  
  return (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sslEnabled?: boolean;
    modsecEnabled?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    return queryClient.ensureQueryData(domainQueryOptions.all(params));
  };
};
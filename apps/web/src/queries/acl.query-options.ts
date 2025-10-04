import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { aclService } from '@/services/acl.service';
import { createQueryKeys } from '@/lib/query-client';
import type { ACLRule } from '@/types';

// Create query keys for ACL operations
export const aclQueryKeys = createQueryKeys('acl');

// Query options for ACL rules
export const aclQueryOptions = {
  // Get all ACL rules
  all: {
    queryKey: aclQueryKeys.lists(),
    queryFn: aclService.getAll,
  },
  
  // Get ACL rule by ID
  byId: (id: string) => ({
    queryKey: aclQueryKeys.detail(id),
    queryFn: () => aclService.getById(id),
  }),
};

// Suspense query options for ACL rules
export const aclSuspenseQueryOptions = {
  // Get all ACL rules
  all: {
    queryKey: aclQueryKeys.lists(),
    queryFn: aclService.getAll,
  },
  
  // Get ACL rule by ID
  byId: (id: string) => ({
    queryKey: aclQueryKeys.detail(id),
    queryFn: () => aclService.getById(id),
  }),
};

// Mutation options for ACL rules
export const aclMutationOptions = {
  // Create ACL rule
  create: {
    mutationFn: aclService.create,
    onSuccess: (data: ACLRule) => {
      console.log('ACL rule created successfully');
    },
    onError: (error: any) => {
      console.error('ACL rule creation failed:', error);
    },
  },
  
  // Update ACL rule
  update: {
    mutationFn: ({ id, data }: { id: string; data: any }) => aclService.update(id, data),
    onSuccess: (data: ACLRule) => {
      console.log('ACL rule updated successfully');
    },
    onError: (error: any) => {
      console.error('ACL rule update failed:', error);
    },
  },
  
  // Delete ACL rule
  delete: {
    mutationFn: (id: string) => aclService.delete(id),
    onSuccess: () => {
      console.log('ACL rule deleted successfully');
    },
    onError: (error: any) => {
      console.error('ACL rule deletion failed:', error);
    },
  },
  
  // Toggle ACL rule
  toggle: {
    mutationFn: (id: string) => aclService.toggle(id),
    onSuccess: (data: ACLRule) => {
      console.log('ACL rule toggled successfully');
    },
    onError: (error: any) => {
      console.error('ACL rule toggle failed:', error);
    },
  },
  
  // Apply ACL rules
  apply: {
    mutationFn: aclService.apply,
    onSuccess: () => {
      console.log('ACL rules applied successfully');
    },
    onError: (error: any) => {
      console.error('ACL rules application failed:', error);
    },
  },
};

// Custom hooks for ACL operations
export const useAclRules = () => {
  return useQuery(aclQueryOptions.all);
};

export const useAclRule = (id: string) => {
  return useQuery(aclQueryOptions.byId(id));
};

// Suspense hooks for deferred loading pattern
export const useSuspenseAclRules = () => {
  return useSuspenseQuery(aclSuspenseQueryOptions.all);
};

export const useSuspenseAclRule = (id: string) => {
  return useSuspenseQuery(aclSuspenseQueryOptions.byId(id));
};

export const useCreateAclRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...aclMutationOptions.create,
    onSuccess: (data: ACLRule) => {
      aclMutationOptions.create.onSuccess?.(data);
      // Invalidate ACL rules list to refresh
      queryClient.invalidateQueries({ queryKey: aclQueryKeys.lists() });
    },
  });
};

export const useUpdateAclRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...aclMutationOptions.update,
    onSuccess: (data: ACLRule, { id }) => {
      aclMutationOptions.update.onSuccess?.(data);
      // Update the specific ACL rule in cache
      queryClient.setQueryData(aclQueryKeys.detail(id), data);
      // Invalidate ACL rules list to refresh
      queryClient.invalidateQueries({ queryKey: aclQueryKeys.lists() });
    },
  });
};

export const useDeleteAclRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...aclMutationOptions.delete,
    onSuccess: (_, id) => {
      aclMutationOptions.delete.onSuccess?.();
      // Remove the specific ACL rule from cache
      queryClient.removeQueries({ queryKey: aclQueryKeys.detail(id) });
      // Invalidate ACL rules list to refresh
      queryClient.invalidateQueries({ queryKey: aclQueryKeys.lists() });
    },
  });
};

export const useToggleAclRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...aclMutationOptions.toggle,
    onSuccess: (data: ACLRule, id) => {
      aclMutationOptions.toggle.onSuccess?.(data);
      // Update the specific ACL rule in cache
      queryClient.setQueryData(aclQueryKeys.detail(id), data);
      // Invalidate ACL rules list to refresh
      queryClient.invalidateQueries({ queryKey: aclQueryKeys.lists() });
    },
  });
};

export const useApplyAclRules = () => {
  return useMutation(aclMutationOptions.apply);
};

// Hook to preload ACL rules data
export const usePreloadAclRules = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery(aclQueryOptions.all);
  };
};

// Hook to ensure ACL rules data is loaded (useful for route loaders)
export const useEnsureAclRules = () => {
  const queryClient = useQueryClient();
  
  return () => {
    return queryClient.ensureQueryData(aclQueryOptions.all);
  };
};
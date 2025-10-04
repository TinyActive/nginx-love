import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import userService, { 
  type User, 
  type CreateUserData, 
  type UpdateUserData, 
  type UserStats 
} from '@/services/user.service';
import { createQueryKeys } from '@/lib/query-client';

// Create query keys for user operations
export const userQueryKeys = createQueryKeys('users');

// Query options for users
export const userQueryOptions = {
  // Get all users
  all: (params?: { role?: string; status?: string; search?: string }) => ({
    queryKey: userQueryKeys.list(params || {}),
    queryFn: () => userService.getAll(params),
  }),
  
  // Get user by ID
  byId: (id: string) => ({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => userService.getById(id),
  }),
  
  // Get user statistics
  stats: {
    queryKey: userQueryKeys.detail('stats'),
    queryFn: userService.getStats,
  },
};

// Suspense query options for users
export const userSuspenseQueryOptions = {
  // Get all users
  all: (params?: { role?: string; status?: string; search?: string }) => ({
    queryKey: userQueryKeys.list(params || {}),
    queryFn: () => userService.getAll(params),
  }),
  
  // Get user by ID
  byId: (id: string) => ({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => userService.getById(id),
  }),
  
  // Get user statistics
  stats: {
    queryKey: userQueryKeys.detail('stats'),
    queryFn: userService.getStats,
  },
};

// Mutation options for users
export const userMutationOptions = {
  // Create user
  create: {
    mutationFn: (data: CreateUserData) => userService.create(data),
    onSuccess: (data: { data: User; message: string }) => {
      console.log('User created successfully');
    },
    onError: (error: any) => {
      console.error('User creation failed:', error);
    },
  },
  
  // Update user
  update: {
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) => 
      userService.update(id, data),
    onSuccess: (data: { data: User; message: string }) => {
      console.log('User updated successfully');
    },
    onError: (error: any) => {
      console.error('User update failed:', error);
    },
  },
  
  // Delete user
  delete: {
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      console.log('User deleted successfully');
    },
    onError: (error: any) => {
      console.error('User deletion failed:', error);
    },
  },
  
  // Update user status
  updateStatus: {
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }) => 
      userService.updateStatus(id, status),
    onSuccess: (data: { data: User; message: string }) => {
      console.log('User status updated successfully');
    },
    onError: (error: any) => {
      console.error('User status update failed:', error);
    },
  },
  
  // Reset user password
  resetPassword: {
    mutationFn: (id: string) => userService.resetPassword(id),
    onSuccess: (data: { message: string; data?: any }) => {
      console.log('User password reset successfully');
    },
    onError: (error: any) => {
      console.error('User password reset failed:', error);
    },
  },
};

// Custom hooks for user operations
export const useUsers = (params?: { role?: string; status?: string; search?: string }) => {
  return useQuery(userQueryOptions.all(params));
};

export const useUser = (id: string) => {
  return useQuery(userQueryOptions.byId(id));
};

export const useUserStats = () => {
  return useQuery(userQueryOptions.stats);
};

// Suspense hooks for deferred loading pattern
export const useSuspenseUsers = (params?: { role?: string; status?: string; search?: string }) => {
  return useSuspenseQuery(userSuspenseQueryOptions.all(params));
};

export const useSuspenseUser = (id: string) => {
  return useSuspenseQuery(userSuspenseQueryOptions.byId(id));
};

export const useSuspenseUserStats = () => {
  return useSuspenseQuery(userSuspenseQueryOptions.stats);
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...userMutationOptions.create,
    onSuccess: (data: { data: User; message: string }) => {
      userMutationOptions.create.onSuccess?.(data);
      // Invalidate users list to refresh
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      // Invalidate user stats to refresh
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail('stats') });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...userMutationOptions.update,
    onSuccess: (data: { data: User; message: string }, { id }) => {
      userMutationOptions.update.onSuccess?.(data);
      // Update the specific user in cache
      queryClient.setQueryData(userQueryKeys.detail(id), data);
      // Invalidate users list to refresh
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...userMutationOptions.delete,
    onSuccess: (_, id) => {
      userMutationOptions.delete.onSuccess?.();
      // Remove the specific user from cache
      queryClient.removeQueries({ queryKey: userQueryKeys.detail(id) });
      // Invalidate users list to refresh
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      // Invalidate user stats to refresh
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail('stats') });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...userMutationOptions.updateStatus,
    onSuccess: (data: { data: User; message: string }, { id }) => {
      userMutationOptions.updateStatus.onSuccess?.(data);
      // Update the specific user in cache
      queryClient.setQueryData(userQueryKeys.detail(id), data);
      // Invalidate users list to refresh
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });
};

export const useResetUserPassword = () => {
  return useMutation(userMutationOptions.resetPassword);
};

// Hook to preload users data
export const usePreloadUsers = () => {
  const queryClient = useQueryClient();
  
  return (params?: { role?: string; status?: string; search?: string }) => {
    queryClient.prefetchQuery(userQueryOptions.all(params));
    queryClient.prefetchQuery(userQueryOptions.stats);
  };
};

// Hook to ensure users data is loaded (useful for route loaders)
export const useEnsureUsers = () => {
  const queryClient = useQueryClient();
  
  return (params?: { role?: string; status?: string; search?: string }) => {
    return Promise.all([
      queryClient.ensureQueryData(userQueryOptions.all(params)),
      queryClient.ensureQueryData(userQueryOptions.stats),
    ]);
  };
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, accountService } from '@/services/auth.service';
import { createQueryKeys } from '@/lib/query-client';
import type {
  LoginRequest,
  LoginResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  Verify2FARequest
} from '@/services/auth.service';
import type { UserProfile, ActivityLog } from '@/types';

// Create query keys for auth operations
export const authQueryKeys = createQueryKeys('auth');

// Query options for authentication
export const authQueryOptions = {
  // Get user profile
  profile: {
    queryKey: authQueryKeys.detail('profile'),
    queryFn: accountService.getProfile,
  },
  
  // Get activity logs
  activityLogs: (page: number = 1, limit: number = 10) => ({
    queryKey: authQueryKeys.list({ page, limit }),
    queryFn: () => accountService.getActivityLogs(page, limit),
  }),
};

// Mutation options for authentication
export const authMutationOptions = {
  // Login mutation
  login: {
    mutationFn: authService.login,
    onSuccess: (data: LoginResponse) => {
      // Store tokens and user data in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
    },
  },
  
  // Verify 2FA mutation
  verify2FA: {
    mutationFn: authService.verify2FA,
    onSuccess: (data: LoginResponse) => {
      // Store tokens and user data in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    },
    onError: (error: any) => {
      console.error('2FA verification failed:', error);
    },
  },
  
  // Logout mutation
  logout: {
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all auth data from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    onError: (error: any) => {
      console.error('Logout failed:', error);
      // Still clear local data even if API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
  
  // Update profile mutation
  updateProfile: {
    mutationFn: (data: UpdateProfileRequest) => accountService.updateProfile(data),
    onSuccess: (updatedProfile: UserProfile) => {
      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(updatedProfile));
    },
    onError: (error: any) => {
      console.error('Profile update failed:', error);
    },
  },
  
  // Change password mutation
  changePassword: {
    mutationFn: (data: ChangePasswordRequest) => accountService.changePassword(data),
    onError: (error: any) => {
      console.error('Password change failed:', error);
    },
  },
  
  // Setup 2FA mutation
  setup2FA: {
    mutationFn: accountService.setup2FA,
    onError: (error: any) => {
      console.error('2FA setup failed:', error);
    },
  },
  
  // Enable 2FA mutation
  enable2FA: {
    mutationFn: (token: string) => accountService.enable2FA(token),
    onError: (error: any) => {
      console.error('2FA enable failed:', error);
    },
  },
  
  // Disable 2FA mutation
  disable2FA: {
    mutationFn: (password: string) => accountService.disable2FA(password),
    onError: (error: any) => {
      console.error('2FA disable failed:', error);
    },
  },
};

// Custom hooks for auth operations
export const useAuthProfile = () => {
  return useQuery(authQueryOptions.profile);
};

export const useAuthActivityLogs = (page: number = 1, limit: number = 10) => {
  return useQuery(authQueryOptions.activityLogs(page, limit));
};

export const useAuthLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...authMutationOptions.login,
    onSuccess: (data) => {
      authMutationOptions.login.onSuccess?.(data);
      // Invalidate profile query to refresh user data
      queryClient.invalidateQueries({ queryKey: authQueryKeys.detail('profile') });
    },
  });
};

export const useAuthVerify2FA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...authMutationOptions.verify2FA,
    onSuccess: (data) => {
      authMutationOptions.verify2FA.onSuccess?.(data);
      // Invalidate profile query to refresh user data
      queryClient.invalidateQueries({ queryKey: authQueryKeys.detail('profile') });
    },
  });
};

export const useAuthLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...authMutationOptions.logout,
    onSuccess: () => {
      authMutationOptions.logout.onSuccess?.();
      // Clear all queries from cache
      queryClient.clear();
    },
  });
};

export const useAuthUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...authMutationOptions.updateProfile,
    onSuccess: (updatedProfile) => {
      authMutationOptions.updateProfile.onSuccess?.(updatedProfile);
      // Update profile query cache
      queryClient.setQueryData(authQueryKeys.detail('profile'), updatedProfile);
    },
  });
};

export const useAuthChangePassword = () => {
  return useMutation(authMutationOptions.changePassword);
};

export const useAuthSetup2FA = () => {
  return useMutation(authMutationOptions.setup2FA);
};

export const useAuthEnable2FA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...authMutationOptions.enable2FA,
    onSuccess: () => {
      // Invalidate profile query to refresh 2FA status
      queryClient.invalidateQueries({ queryKey: authQueryKeys.detail('profile') });
    },
  });
};

export const useAuthDisable2FA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    ...authMutationOptions.disable2FA,
    onSuccess: () => {
      // Invalidate profile query to refresh 2FA status
      queryClient.invalidateQueries({ queryKey: authQueryKeys.detail('profile') });
    },
  });
};
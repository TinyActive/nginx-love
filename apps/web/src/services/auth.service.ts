import api from './api';
import { tokenStorage } from '@/lib/auth-storage';
import { UserProfile, ActivityLog, TwoFactorAuth } from '@/types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  requires2FA: boolean;
  requirePasswordChange?: boolean;
  require2FASetup?: boolean;
  userId?: string;
  tempToken?: string;
}

export interface FirstLoginPasswordChangeRequest {
  userId: string;
  tempToken: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  language?: 'en' | 'vi';
}

export interface Verify2FARequest {
  userId: string;
  token: string;
}

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// Authentication APIs
export const authService = {
  // Login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    tokenStorage.clearAuth();
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  // Change password on first login
  changePasswordFirstLogin: async (data: FirstLoginPasswordChangeRequest): Promise<LoginResponse & { require2FASetup: boolean }> => {
    const response = await api.post('/auth/first-login/change-password', data);
    return response.data.data;
  },

  // Verify 2FA during login
  verify2FA: async (data: Verify2FARequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/verify-2fa', data);
    return response.data.data;
  },
};

// Account APIs
export const accountService = {
  // Get profile
  getProfile: async (): Promise<UserProfile & { twoFactorEnabled: boolean }> => {
    const response = await api.get('/account/profile');
    return response.data.data;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put('/account/profile', data);
    return response.data.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/account/password', data);
  },

  // Get activity logs
  getActivityLogs: async (page = 1, limit = 10): Promise<{ logs: ActivityLog[]; pagination: any }> => {
    const response = await api.get(`/account/activity?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Setup 2FA (get QR code and secret)
  setup2FA: async (): Promise<Enable2FAResponse> => {
    const response = await api.post('/account/2fa/setup');
    return response.data.data;
  },

  // Enable 2FA (verify token and enable)
  enable2FA: async (token: string): Promise<void> => {
    await api.post('/account/2fa/enable', { token });
  },

  // Legacy alias for setup2FA (for backward compatibility)
  verify2FA: async (token: string): Promise<void> => {
    await api.post('/account/2fa/enable', { token });
  },

  // Disable 2FA
  disable2FA: async (password: string): Promise<void> => {
    await api.post('/account/2fa/disable', { password });
  },
};

// Export TanStack Query hooks for backward compatibility
// These will be imported from the query options files in components
// but we're keeping the service functions as they are for now
// to ensure backward compatibility during the transition

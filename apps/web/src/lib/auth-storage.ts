import { UserProfile } from '@/types';

// Auth storage keys - centralized constants
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

/**
 * Token storage utilities using localStorage
 */
export const tokenStorage = {
  // Get access token
  getAccessToken: (): string | null => {
    return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
  },

  // Set access token
  setAccessToken: (token: string): void => {
    localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, token);
  },

  // Remove access token
  removeAccessToken: (): void => {
    localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
  },

  // Set refresh token
  setRefreshToken: (token: string): void => {
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, token);
  },

  // Remove refresh token
  removeRefreshToken: (): void => {
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
  },

  // Get user profile
  getUser: (): UserProfile | null => {
    try {
      const userStr = localStorage.getItem(AUTH_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Set user profile
  setUser: (user: UserProfile): void => {
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
  },

  // Remove user profile
  removeUser: (): void => {
    localStorage.removeItem(AUTH_KEYS.USER);
  },

  // Set all auth data
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string): void => {
    tokenStorage.setUser(user);
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
  },

  // Clear all auth data
  clearAuth: (): void => {
    tokenStorage.removeUser();
    tokenStorage.removeAccessToken();
    tokenStorage.removeRefreshToken();
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!(tokenStorage.getUser() && tokenStorage.getAccessToken());
  },

  // Get all tokens
  getTokens: () => {
    return {
      accessToken: tokenStorage.getAccessToken(),
      refreshToken: tokenStorage.getRefreshToken(),
    };
  },
};

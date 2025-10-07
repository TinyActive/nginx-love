import Cookies from 'js-cookie';
import { UserProfile } from '@/types';

// Auth storage keys - centralized constants
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

// Cookie options
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  path: '/',
  sameSite: 'strict',
  secure: import.meta.env.PROD, // Only secure in production
};

const ACCESS_TOKEN_EXPIRY = 7; // 7 days
const REFRESH_TOKEN_EXPIRY = 30; // 30 days

/**
 * Token storage utilities using cookies
 */
export const tokenStorage = {
  // Get access token
  getAccessToken: (): string | null => {
    return Cookies.get(AUTH_KEYS.ACCESS_TOKEN) || null;
  },

  // Set access token
  setAccessToken: (token: string): void => {
    Cookies.set(AUTH_KEYS.ACCESS_TOKEN, token, {
      ...COOKIE_OPTIONS,
      expires: ACCESS_TOKEN_EXPIRY,
    });
  },

  // Remove access token
  removeAccessToken: (): void => {
    Cookies.remove(AUTH_KEYS.ACCESS_TOKEN, { path: '/' });
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    return Cookies.get(AUTH_KEYS.REFRESH_TOKEN) || null;
  },

  // Set refresh token
  setRefreshToken: (token: string): void => {
    Cookies.set(AUTH_KEYS.REFRESH_TOKEN, token, {
      ...COOKIE_OPTIONS,
      expires: REFRESH_TOKEN_EXPIRY,
    });
  },

  // Remove refresh token
  removeRefreshToken: (): void => {
    Cookies.remove(AUTH_KEYS.REFRESH_TOKEN, { path: '/' });
  },

  // Get user profile
  getUser: (): UserProfile | null => {
    try {
      const userStr = Cookies.get(AUTH_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Set user profile
  setUser: (user: UserProfile): void => {
    Cookies.set(AUTH_KEYS.USER, JSON.stringify(user), {
      ...COOKIE_OPTIONS,
      expires: ACCESS_TOKEN_EXPIRY,
    });
  },

  // Remove user profile
  removeUser: (): void => {
    Cookies.remove(AUTH_KEYS.USER, { path: '/' });
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

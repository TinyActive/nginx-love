import { useEffect, useState, useCallback } from 'react';
import { tokenStorage } from '@/lib/auth-storage';
import { UserProfile } from '@/types';

/**
 * Custom hook for reactive access to auth user
 */
export function useAuthUser() {
  const [user, setUser] = useState<UserProfile | null>(() => tokenStorage.getUser());

  // Update user from storage
  const refreshUser = useCallback(() => {
    setUser(tokenStorage.getUser());
  }, []);

  // Listen for storage changes (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        refreshUser();
      }
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      refreshUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:change', handleAuthChange);
    window.addEventListener('auth:logout', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:change', handleAuthChange);
      window.removeEventListener('auth:logout', handleAuthChange);
    };
  }, [refreshUser]);

  // Update user
  const updateUser = useCallback((newUser: UserProfile | null) => {
    if (newUser) {
      tokenStorage.setUser(newUser);
    } else {
      tokenStorage.removeUser();
    }
    setUser(newUser);
    window.dispatchEvent(new CustomEvent('auth:change'));
  }, []);

  return { user, updateUser, refreshUser };
}

/**
 * Custom hook for reactive access to access token
 */
export function useAccessToken() {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    tokenStorage.getAccessToken()
  );

  const refreshToken = useCallback(() => {
    setAccessToken(tokenStorage.getAccessToken());
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      refreshToken();
    };

    window.addEventListener('auth:change', handleAuthChange);
    window.addEventListener('auth:logout', handleAuthChange);

    return () => {
      window.removeEventListener('auth:change', handleAuthChange);
      window.removeEventListener('auth:logout', handleAuthChange);
    };
  }, [refreshToken]);

  const updateToken = useCallback((token: string | null) => {
    if (token) {
      tokenStorage.setAccessToken(token);
    } else {
      tokenStorage.removeAccessToken();
    }
    setAccessToken(token);
    window.dispatchEvent(new CustomEvent('auth:change'));
  }, []);

  return { accessToken, updateToken, refreshToken };
}

/**
 * Custom hook for reactive authentication state
 */
export function useAuthStorage() {
  const { user, updateUser, refreshUser } = useAuthUser();
  const { accessToken, updateToken: updateAccessToken } = useAccessToken();

  const isAuthenticated = !!(user && accessToken);

  const setAuth = useCallback((
    userData: UserProfile,
    access: string,
    refresh: string
  ) => {
    tokenStorage.setAuth(userData, access, refresh);
    updateUser(userData);
    updateAccessToken(access);
  }, [updateUser, updateAccessToken]);

  const clearAuth = useCallback(() => {
    tokenStorage.clearAuth();
    updateUser(null);
    updateAccessToken(null);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }, [updateUser, updateAccessToken]);

  const refreshAuthState = useCallback(() => {
    refreshUser();
  }, [refreshUser]);

  return {
    user,
    accessToken,
    isAuthenticated,
    setAuth,
    clearAuth,
    refreshAuthState,
  };
}

import { useEffect, useRef, useCallback } from 'react';
import { tokenStorage } from '@/lib/auth-storage';
import { authService } from '@/services/auth.service';
import { useActivityTracker } from './useActivityTracker';

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes (refresh before token expires in 15 minutes)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity

/**
 * Hook to automatically refresh token when user is active
 * - Refresh token every 10 minutes if user is active
 * - Automatically logout after 15 minutes of inactivity
 */
export function useAutoTokenRefresh() {
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (!currentRefreshToken) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      console.log('[Auto Refresh] Refreshing token due to user activity...');

      const result = await authService.refreshToken(currentRefreshToken);

      // Update tokens
      tokenStorage.setAccessToken(result.accessToken);
      tokenStorage.setRefreshToken(result.refreshToken);

    // Dispatch event so other components know the token has been refreshed
      window.dispatchEvent(new CustomEvent('auth:token-refreshed'));
      
      console.log('[Auto Refresh] Token refreshed successfully');
    } catch (error) {
      console.error('[Auto Refresh] Failed to refresh token:', error);
      
    // If refresh fails, logout user

      tokenStorage.clearAuth();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      window.location.href = '/login';
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Handle user activity - refresh token
  const handleActivity = useCallback(() => {
    console.log('[Auto Refresh] User activity detected');
    
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Set new timer to refresh token
    refreshTimerRef.current = setTimeout(() => {
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL);
  }, [refreshToken]);

  // Handle inactivity - logout user
  const handleInactivity = useCallback(() => {
    console.log('[Auto Refresh] User inactive for 15 minutes, logging out...');
    
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    tokenStorage.clearAuth();
    window.dispatchEvent(new CustomEvent('auth:logout'));
    window.location.href = '/login';
  }, []);

  // Track user activity
  useActivityTracker({
    onActivity: handleActivity,
    inactivityTimeout: INACTIVITY_TIMEOUT,
    onInactive: handleInactivity,
  });

  // Cleanup on unmount
  useEffect(() => {
    // Initial refresh timer
    const isAuthenticated = tokenStorage.isAuthenticated();
    if (isAuthenticated) {
      refreshTimerRef.current = setTimeout(() => {
        refreshToken();
      }, TOKEN_REFRESH_INTERVAL);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refreshToken]);

  // Listen for visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tab/minimized, clear refresh timer
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
        }
      } else {
        // User returned to tab, trigger activity
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleActivity]);
}

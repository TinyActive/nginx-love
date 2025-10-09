import { useEffect, useRef, useCallback } from 'react';

interface ActivityTrackerOptions {
  onActivity: () => void;
  inactivityTimeout: number; // milliseconds
  onInactive?: () => void;
}

/**
 * Hook to track user activity.
 * Detects events: mouse move, click, keypress, scroll, touch.
 */
export function useActivityTracker({
  onActivity,
  inactivityTimeout,
  onInactive,
}: ActivityTrackerOptions) {
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    if (onInactive) {
      activityTimeoutRef.current = setTimeout(() => {
        onInactive();
      }, inactivityTimeout);
    }
  }, [inactivityTimeout, onInactive]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // Only trigger if at least 1 minute has passed since the last time
    // Prevent calling too many times
    if (timeSinceLastActivity > 60000) { // 1 minute
      lastActivityRef.current = now;
      onActivity();
    }

    // Reset inactivity timer every time there is activity
    resetInactivityTimer();
  }, [onActivity, resetInactivityTimer]);

  useEffect(() => {
    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle to avoid calling too frequently
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleActivity();
          throttleTimeout = null;
        }, 1000); // Throttle 1 second
      }
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, throttledHandler);
    });

    // Start inactivity timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [handleActivity, resetInactivityTimer]);

  return {
    lastActivity: lastActivityRef.current,
  };
}

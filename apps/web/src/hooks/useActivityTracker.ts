import { useEffect, useRef, useCallback } from 'react';

interface ActivityTrackerOptions {
  onActivity: () => void;
  inactivityTimeout: number; // milliseconds
  onInactive?: () => void;
}

/**
 * Hook để track hoạt động của người dùng
 * Phát hiện các sự kiện: mouse move, click, keypress, scroll, touch
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

    // Chỉ trigger nếu đã qua ít nhất 1 phút kể từ lần cuối
    // Tránh gọi quá nhiều lần
    if (timeSinceLastActivity > 60000) { // 1 phút
      lastActivityRef.current = now;
      onActivity();
    }

    // Reset inactivity timer mỗi khi có hoạt động
    resetInactivityTimer();
  }, [onActivity, resetInactivityTimer]);

  useEffect(() => {
    // Các sự kiện để track hoạt động
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle để tránh gọi quá nhiều
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleActivity();
          throttleTimeout = null;
        }, 1000); // Throttle 1 giây
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

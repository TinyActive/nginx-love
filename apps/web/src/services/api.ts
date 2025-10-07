import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@/lib/auth-storage';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  tokenStorage.clearAuth();

  // Dispatch custom event to notify auth context
  window.dispatchEvent(new CustomEvent('auth:logout'));

  // Small delay to allow state to update before redirect
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we have a valid request config
    if (error.response?.status === 401 && originalRequest) {
      // If already retried, don't try again
      if (originalRequest._retry) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        isRefreshing = false;
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 10000 } // 10 second timeout for refresh requests
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        if (!accessToken || !newRefreshToken) {
          throw new Error('Invalid refresh response');
        }

        tokenStorage.setAccessToken(accessToken);
        tokenStorage.setRefreshToken(newRefreshToken);

        // Update the failed queue
        processQueue(null, accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed - log error for debugging
        console.error('Token refresh failed:', refreshError);

        // Clear the failed queue
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear auth and redirect to login
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import { createRoot } from "react-dom/client";
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { AuthProvider, useAuth } from './auth';
import { QueryClient } from '@tanstack/react-query';
import "./index.css";

// Create a singleton QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return error.response.status === 408 || error.response.status === 429 ? failureCount < 2 : false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppWithRouterContext() {
  const auth = useAuth();
  
  // Create a new router context object to ensure reactivity
  const routerContext = {
    auth: {
      isAuthenticated: auth.isAuthenticated,
      currentUser: auth.user
    },
    queryClient
  };
  
  return (
    <RouterProvider
      router={router}
      context={routerContext}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppWithRouterContext />
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

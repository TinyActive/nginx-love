import { createRoot } from "react-dom/client";
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { AuthProvider, useAuth } from './auth';
import "./index.css";

function AppWithRouterContext() {
  const auth = useAuth();
  
  // Create a new router context object to ensure reactivity
  const routerContext = {
    auth: {
      isAuthenticated: auth.isAuthenticated,
      currentUser: auth.user
    }
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

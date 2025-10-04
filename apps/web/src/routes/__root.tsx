import { createRootRouteWithContext, Outlet, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { ThemeProvider } from 'next-themes'
import { Suspense } from 'react'
import '@/lib/i18n'
import '@/index.css'

// Define the router context type
interface RouterContext {
  auth: {
    isAuthenticated: boolean
    currentUser: any
  }
  queryClient: QueryClient
}

function RootComponent() {
  const { queryClient } = useRouteContext({ from: '__root__' });

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <TooltipProvider>
                <Toaster />
                <div className="min-h-screen bg-background">
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <Outlet />
                  </Suspense>
                </div>
                <TanStackRouterDevtools />
              </TooltipProvider>
            </ThemeProvider>
          )}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ({ error }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto max-w-md">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  ),
})

import { createRootRouteWithContext, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { ThemeProvider } from 'next-themes'
import '@/lib/i18n'
import '@/index.css'

const queryClient = new QueryClient()

// Define the router context type
interface RouterContext {
  auth: {
    isAuthenticated: boolean
    currentUser: any
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <div className="min-h-screen bg-background">
              <Outlet />
            </div>
            <TanStackRouterDevtools />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  ),
})

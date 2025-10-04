import Dashboard from '@/components/pages/Dashboard'
import { createFileRoute } from '@tanstack/react-router'
import { dashboardQueryOptions } from '@/queries/dashboard.query-options'

export const Route = createFileRoute('/_auth/dashboard')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Prefetch all dashboard data but don't await it (allow it to load in background)
    queryClient.prefetchQuery(dashboardQueryOptions.stats)
    queryClient.prefetchQuery(dashboardQueryOptions.systemMetrics('24h'))
    queryClient.prefetchQuery(dashboardQueryOptions.recentAlerts(5))
    
    return {}
  },
})

function RouteComponent() {
  return <Dashboard />
}

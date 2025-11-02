import DashboardNew from '@/components/pages/DashboardNew'
import { createFileRoute } from '@tanstack/react-router'
import { dashboardQueryOptions, dashboardAnalyticsQueryOptions } from '@/queries'

export const Route = createFileRoute('/_auth/dashboard')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Prefetch dashboard stats
    queryClient.prefetchQuery(dashboardQueryOptions.stats)
    queryClient.prefetchQuery(dashboardQueryOptions.systemMetrics('24h'))
    queryClient.prefetchQuery(dashboardQueryOptions.recentAlerts(5))
    
    // Prefetch dashboard analytics data
    queryClient.prefetchQuery(dashboardAnalyticsQueryOptions.requestTrend(5))
    queryClient.prefetchQuery(dashboardAnalyticsQueryOptions.slowRequests(10))
    queryClient.prefetchQuery(dashboardAnalyticsQueryOptions.latestAttacks(5))
    queryClient.prefetchQuery(dashboardAnalyticsQueryOptions.latestNews(20))
    queryClient.prefetchQuery(dashboardAnalyticsQueryOptions.requestAnalytics('day'))
    queryClient.prefetchQuery(dashboardAnalyticsQueryOptions.attackRatio())
    
    return {}
  },
})

function RouteComponent() {
  return <DashboardNew />
}

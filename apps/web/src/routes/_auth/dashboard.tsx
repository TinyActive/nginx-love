import Dashboard from '@/pages/Dashboard'
import { createFileRoute } from '@tanstack/react-router'
import { ensureDashboardData } from '@/lib/route-loaders'
import { SkeletonPage } from '@/components/ui/skeletons'

export const Route = createFileRoute('/_auth/dashboard')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    // Only prefetch the essential fast data (basic stats)
    await queryClient.ensureQueryData({
      queryKey: ['dashboard', 'detail', 'stats'],
      queryFn: async () => {
        const { dashboardService } = await import('@/services/dashboard.service');
        return dashboardService.getDashboardStats();
      },
      staleTime: 30 * 1000,
    });
    
    // Prefetch the chart data but don't await it (allow it to load in background)
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'list', { period: '24h' }],
      queryFn: async () => {
        const { dashboardService } = await import('@/services/dashboard.service');
        return dashboardService.getSystemMetrics('24h');
      },
      staleTime: 60 * 1000,
    });
    
    // Prefetch recent alerts but don't await it
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'list', { limit: 5 }],
      queryFn: async () => {
        const { dashboardService } = await import('@/services/dashboard.service');
        return dashboardService.getRecentAlerts(5);
      },
      staleTime: 15 * 1000,
    });
    
    return {}
  },
  pendingComponent: () => <SkeletonPage type="dashboard" />,
})

function RouteComponent() {
  return <Dashboard />
}

import Performance from '@/components/pages/Performance'
import { createFileRoute } from '@tanstack/react-router'
import { performanceQueryOptions } from '@/queries/performance.query-options'

export const Route = createFileRoute('/_auth/performance')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context;
    
    // Prefetch performance data but don't await it (allow it to load in background)
    queryClient.prefetchQuery(performanceQueryOptions.metrics())
    queryClient.prefetchQuery(performanceQueryOptions.stats())
    queryClient.prefetchQuery(performanceQueryOptions.history())
    
    return {};
  },
})

function RouteComponent() {
  return <Performance />
}
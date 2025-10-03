import Performance from '@/pages/Performance'
import { createFileRoute } from '@tanstack/react-router'
import { ensurePerformanceData } from '@/lib/route-loaders'

export const Route = createFileRoute('/_auth/performance')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context;
    // Only prefetch the fast-loading stats data in the loader
    await ensurePerformanceData(queryClient, 'all', '1h');
    return {};
  },
})

function RouteComponent() {
  return <Performance />
}
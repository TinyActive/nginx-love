import Logs from '@/components/pages/Logs'
import { createFileRoute } from '@tanstack/react-router'
import { ensureLogsData } from '@/lib/route-loaders'

export const Route = createFileRoute('/_auth/logs')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context;
    // Only prefetch the fast-loading statistics data in the loader
    await ensureLogsData(queryClient, { page: 1, limit: 10 });
    return {};
  },
})

function RouteComponent() {
  return <Logs />
}
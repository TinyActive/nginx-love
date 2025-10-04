import Logs from '@/components/pages/Logs'
import { createFileRoute } from '@tanstack/react-router'
import { logsQueryOptions } from '@/queries/logs.query-options'

export const Route = createFileRoute('/_auth/logs')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context;
    
    // Prefetch logs data but don't await it (allow it to load in background)
    queryClient.prefetchQuery(logsQueryOptions.all())
    queryClient.prefetchQuery(logsQueryOptions.statistics)
    queryClient.prefetchQuery(logsQueryOptions.availableDomains)
    
    return {};
  },
})

function RouteComponent() {
  return <Logs />
}
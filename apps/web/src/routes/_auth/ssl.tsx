import SSL from '@/components/pages/SSL'
import { createFileRoute } from '@tanstack/react-router'
import { sslQueryOptions } from '@/queries/ssl.query-options'

export const Route = createFileRoute('/_auth/ssl')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Prefetch SSL data but don't await it (allow it to load in background)
    queryClient.prefetchQuery(sslQueryOptions.all)
    
    return {}
  },
})

function RouteComponent() {
  return <SSL />
}
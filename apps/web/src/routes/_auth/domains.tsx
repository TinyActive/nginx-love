import Domains from '@/components/pages/Domains'
import { createFileRoute } from '@tanstack/react-router'
import { domainQueryOptions } from '@/queries/domain.query-options'

export const Route = createFileRoute('/_auth/domains')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Prefetch domains data with default params but don't await it (allow it to load in background)
    queryClient.prefetchQuery(domainQueryOptions.all({
      page: 1,
      limit: 10,
      search: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }))
    queryClient.prefetchQuery(domainQueryOptions.installationStatus)
    
    return {}
  },
})

function RouteComponent() {
  return <Domains />
}
import { ACL } from '@/components/pages'
import { createFileRoute } from '@tanstack/react-router'
import { aclQueryOptions } from '@/queries/acl.query-options'

export const Route = createFileRoute('/_auth/acl')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Prefetch ACL data but don't await it (allow it to load in background)
    queryClient.prefetchQuery(aclQueryOptions.all)
    
    return {}
  },
})

function RouteComponent() {
  return <ACL />
}
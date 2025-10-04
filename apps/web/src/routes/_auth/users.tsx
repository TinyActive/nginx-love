import Users from '@/components/pages/Users'
import { createFileRoute } from '@tanstack/react-router'
import { userQueryOptions } from '@/queries/user.query-options'

export const Route = createFileRoute('/_auth/users')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Prefetch user management data but don't await it (allow it to load in background)
    queryClient.prefetchQuery(userQueryOptions.all())
    queryClient.prefetchQuery(userQueryOptions.stats)
    
    return {}
  },
})

function RouteComponent() {
  return <Users />
}
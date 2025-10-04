import ModSecurity from '@/components/pages/ModSecurity'
import { createFileRoute, Await } from '@tanstack/react-router'
import { Suspense } from 'react'
import { modsecQueryOptions } from '@/queries/modsec.query-options'
import { SkeletonPage } from '@/components/ui/skeleton-page'

export const Route = createFileRoute('/_auth/modsecurity')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Prefetch ModSecurity data but don't await it (allow it to load in background)
    queryClient.prefetchQuery(modsecQueryOptions.crsRules())
    queryClient.prefetchQuery(modsecQueryOptions.customRules())
    queryClient.prefetchQuery(modsecQueryOptions.globalSettings)
    
    return {}
  },
})

function RouteComponent() {
  return (
    <Suspense fallback={<SkeletonPage type="table" />}>
      <ModSecurity />
    </Suspense>
  )
}
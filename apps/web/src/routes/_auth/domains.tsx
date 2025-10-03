import Domains from '@/pages/Domains'
import { createFileRoute } from '@tanstack/react-router'
import { ensureDomainsData } from '@/lib/route-loaders'
import { SkeletonPage } from '@/components/ui/skeletons'

export const Route = createFileRoute('/_auth/domains')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { queryClient } = context
    // Preload domains data before rendering the component
    await ensureDomainsData(queryClient)
    return {}
  },
  pendingComponent: () => <SkeletonPage type="table" />,
})

function RouteComponent() {
  return <Domains />
}
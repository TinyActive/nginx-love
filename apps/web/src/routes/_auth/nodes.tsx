import SlaveNodes from '@/components/pages/SlaveNodes'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/nodes')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SlaveNodes />
}
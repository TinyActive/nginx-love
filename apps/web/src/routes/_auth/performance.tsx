import Performance from '@/pages/Performance'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/performance')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Performance />
}
import Domains from '@/pages/Domains'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/domains')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Domains />
}
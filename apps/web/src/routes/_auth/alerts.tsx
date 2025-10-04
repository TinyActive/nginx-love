import { Alerts } from '@/components/pages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/alerts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Alerts />
}
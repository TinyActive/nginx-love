import SSL from '@/pages/SSL'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/ssl')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SSL />
}
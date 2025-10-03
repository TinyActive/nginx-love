import ModSecurity from '@/pages/ModSecurity'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/modsecurity')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ModSecurity />
}
import { ACL } from '@/components/pages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/acl')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ACL />
}
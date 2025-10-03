import Users from '@/pages/Users'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/users')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Users />
}
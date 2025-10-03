import Logs from '@/pages/Logs'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/logs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Logs />
}
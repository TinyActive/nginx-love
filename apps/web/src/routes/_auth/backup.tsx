import Backup from '@/pages/Backup'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/backup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Backup />
}
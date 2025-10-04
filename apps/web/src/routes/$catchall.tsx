import { createFileRoute } from '@tanstack/react-router'
import NotFound from '@/components/pages/NotFound'

export const Route = createFileRoute('/$catchall')({
  component: NotFound,
})
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/')({
  beforeLoad: async () => {
    throw redirect({
      to: '/dashboard',
    })
  },
})
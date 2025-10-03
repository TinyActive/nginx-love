import { createRouter, createRootRouteWithContext } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { useStore } from './store/useStore'

// Define the router context type
interface RouterContext {
  auth: {
    isAuthenticated: boolean
    currentUser: any
  }
}

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // This will be injected by the provider
  },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { router }
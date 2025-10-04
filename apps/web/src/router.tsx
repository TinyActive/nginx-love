import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // This will be injected by the provider
    queryClient: undefined!, // This will be injected by the provider
  },
  defaultPreload: 'intent',
  defaultErrorComponent: ({ error }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto max-w-md">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { router }
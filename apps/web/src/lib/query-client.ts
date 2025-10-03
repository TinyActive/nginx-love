import { useQueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'

/**
 * Hook to access the QueryClient from the router context
 * This ensures we're using the same QueryClient instance throughout the app
 */
export function useRouteQueryClient() {
  const { queryClient } = useRouteContext({ from: '__root__' })
  return queryClient
}

/**
 * Helper function to create query keys with consistent naming
 */
export function createQueryKeys(baseKey: string) {
  return {
    all: [baseKey] as const,
    lists: () => [baseKey, 'list'] as const,
    list: (filters: Record<string, any>) => [baseKey, 'list', filters] as const,
    details: () => [baseKey, 'detail'] as const,
    detail: (id: string | number) => [baseKey, 'detail', id] as const,
  }
}
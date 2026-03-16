import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

const handleApiError = (_error: Error) => {
  // handled by interceptor
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

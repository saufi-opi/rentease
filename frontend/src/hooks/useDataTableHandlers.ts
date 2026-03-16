import { useNavigate } from "@tanstack/react-router"
import type { OnChangeFn, SortingState } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDebounce } from "./useDebounce"

interface BaseSearchParams {
  page?: number
  size?: number
  sort?: string
  q?: string
  filter?: Record<string, string | number | boolean | undefined>
}

interface UseDataTableHandlersOptions {
  skipSearchSync?: boolean
}

export function useDataTableHandlers<T extends BaseSearchParams>(
  route: { useSearch: (opts?: any) => T; id: string },
  options: UseDataTableHandlersOptions = { skipSearchSync: true },
) {
  const rawNavigate = useNavigate()
  const navigate = useMemo(
    () =>
      rawNavigate as (opts: {
        to?: string
        search: (prev: T) => T
        replace?: boolean
      }) => Promise<void>,
    [rawNavigate],
  )

  const searchParams = route.useSearch() as T
  const { page = 1, size = 10, sort, q } = searchParams

  const [localSearch, setLocalSearch] = useState(q ?? "")
  const debouncedSearch = useDebounce(localSearch, 500)

  // Sync local search from URL q (e.g. on browser back/forward)
  useEffect(() => {
    setLocalSearch(q ?? "")
  }, [q])

  // Sync debounced search to URL
  useEffect(() => {
    if (options.skipSearchSync) return

    if (debouncedSearch !== (q ?? "")) {
      navigate({
        search: (prev) => ({
          ...prev,
          q: debouncedSearch || undefined,
          page: 1,
        }),
        replace: true,
      })
    }
  }, [debouncedSearch, q, navigate, options.skipSearchSync])

  const sorting = useMemo<SortingState>(() => {
    if (!sort) return []
    const [id, desc] = sort.split(":")
    return [{ id, desc: desc === "desc" }]
  }, [sort])

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      const sortValue = next.length
        ? `${next[0].id}:${next[0].desc ? "desc" : "asc"}`
        : undefined

      navigate({
        search: (prev) => ({
          ...prev,
          sort: sortValue,
          page: 1,
        }),
        replace: true,
      })
    },
    [sorting, navigate],
  )

  const handlePaginationChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      navigate({
        search: (prev) => ({
          ...prev,
          page: pageIndex + 1,
          size: pageSize,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const apiSort = useMemo(() => {
    if (!sort) return undefined
    const [id, desc] = sort.split(":")
    return `${desc === "desc" ? "-" : ""}${id}`
  }, [sort])

  return {
    page,
    size,
    sort,
    q,
    sorting,
    apiSort,
    localSearch,
    setLocalSearch,
    handleSortingChange,
    handlePaginationChange,
    navigate,
    searchParams,
  }
}

import { z } from "zod"

export const paginationSearchSchema = z
  .object({
    page: z.coerce.number().catch(1),
    size: z.coerce.number().catch(10),
    q: z.string().catch(""),
    sort: z.string().catch(""),
    filter: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.undefined()]),
    ),
  })
  .partial()

export type PaginationSearch = z.infer<typeof paginationSearchSchema>

import { AxiosError } from "axios"
import type { ApiError } from "./client"

function extractErrorMessage(err: ApiError): string {
  if (err instanceof AxiosError) {
    return err.message
  }

  const errDetail = (err.body as any)?.message
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    return errDetail[0].msg
  }
  return errDetail || "Something went wrong."
}

export const handleError = function (
  this: (msg: string) => void,
  err: ApiError,
) {
  const errorMessage = extractErrorMessage(err)
  this(errorMessage)
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

export const cleanObject = <T extends Record<string, any>>(
  obj: T,
): T | undefined => {
  if (!obj) return undefined

  const newObj = { ...obj }
  Object.keys(newObj).forEach((key) => {
    if (
      newObj[key] === undefined ||
      newObj[key] === null ||
      newObj[key] === ""
    ) {
      delete newObj[key]
    }
  })

  return Object.keys(newObj).length > 0 ? newObj : undefined
}

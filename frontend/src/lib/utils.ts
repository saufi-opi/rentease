import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date string as UTC. 
 * Backend stores timestamps in UTC but may not include the 'Z' suffix.
 * This function ensures the timestamp is treated as UTC.
 */
export function parseUTCDate(dateString: string): Date {
  return parseISO(dateString.endsWith('Z') ? dateString : dateString + 'Z')
}

/**
 * Format a UTC date string to a human-readable relative time (e.g., "5 minutes ago").
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseUTCDate(dateString), { addSuffix: true })
}

/**
 * Convert a string to a URL-friendly slug.
 */
export const slugify = (text: string): string =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -

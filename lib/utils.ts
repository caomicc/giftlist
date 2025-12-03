import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date as relative time for recent dates (<7 days) or absolute for older dates.
 * @param date - The date to format (string or Date)
 * @param translations - Optional translation strings for time units
 * @returns Formatted time string
 */
export function formatRelativeTime(
  date: string | Date,
  translations?: {
    justNow?: string
    minutesAgo?: string
    hoursAgo?: string
    daysAgo?: string
  }
): string {
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  // For dates older than 7 days, use absolute date
  if (diffDays >= 7) {
    return then.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Just now (less than 1 minute)
  if (diffMinutes < 1) {
    return translations?.justNow || 'Just now'
  }

  // Minutes ago
  if (diffMinutes < 60) {
    const template = translations?.minutesAgo || '{{count}}m ago'
    return template.replace('{{count}}', String(diffMinutes))
  }

  // Hours ago
  if (diffHours < 24) {
    const template = translations?.hoursAgo || '{{count}}h ago'
    return template.replace('{{count}}', String(diffHours))
  }

  // Days ago (1-6 days)
  const template = translations?.daysAgo || '{{count}}d ago'
  return template.replace('{{count}}', String(diffDays))
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Relative time for dates under 7 days old ("5 minutes ago"), absolute date otherwise. */
export function formatRelativeTime(date: string | Date, locale?: string): string {
  const then = new Date(date)
  const minutes = Math.round((then.getTime() - Date.now()) / 60000)
  if (minutes <= -7 * 24 * 60) {
    return then.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
  if (minutes === 0) return rtf.format(0, 'second') // "now"
  if (minutes > -60) return rtf.format(minutes, 'minute')
  if (minutes > -24 * 60) return rtf.format(Math.round(minutes / 60), 'hour')
  return rtf.format(Math.round(minutes / 1440), 'day')
}

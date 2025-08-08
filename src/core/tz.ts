import { DateTime, Interval } from 'luxon'

import type { DateLike } from './types'

export function dtFrom(date: DateLike | undefined, zone: string): DateTime {
  if (date === undefined) return DateTime.now().setZone(zone)
  if (date instanceof Date) return DateTime.fromJSDate(date).setZone(zone)
  // ISO-like strings interpreted in the given zone
  const parsed = DateTime.fromISO(date, { setZone: true })
  return parsed.isValid ? parsed.setZone(zone) : DateTime.invalid('Invalid date')
}

export function toDate(dt: DateTime): Date {
  return dt.toJSDate()
}

export function createDayInterval(dt: DateTime): Interval {
  const start = dt.startOf('day')
  const end = dt.endOf('day')
  return Interval.fromDateTimes(start, end)
}

export function normalizeISODate(dateISO: string, zone: string): string {
  // Ensures YYYY-MM-DD for given zone's calendar day
  const dt = DateTime.fromISO(dateISO, { zone })
  return dt.toISODate()!
}


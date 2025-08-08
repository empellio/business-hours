import { DateTime } from 'luxon'
import type { WeekdayNumbers } from 'luxon'
import type { WeekdayKey } from './types'

export function formatSlot(
  slot: { open: Date; close: Date },
  options?: { locale?: string; timezone?: string },
): string {
  const zone = options?.timezone
  const locale = options?.locale ?? 'en-US'
  const o = DateTime.fromJSDate(slot.open).setZone(zone).setLocale(locale)
  const c = DateTime.fromJSDate(slot.close).setZone(zone).setLocale(locale)
  return `${o.toFormat('HH:mm')}–${c.toFormat('HH:mm')}`
}

export function formatDayName(
  weekday: WeekdayKey,
  options?: { locale?: string },
): string {
  const locale = options?.locale ?? 'en-US'
  const map: Record<WeekdayKey, WeekdayNumbers> = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 7,
  }
  const dt = DateTime.now().set({ weekday: map[weekday] }).setLocale(locale)
  return dt.toFormat('EEE')
}


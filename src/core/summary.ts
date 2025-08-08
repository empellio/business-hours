import { DateTime } from 'luxon'
import type { BusinessHours, Config, WeekdayKey } from './types'
import { formatDayName, formatSlot } from './format'

const ORDER: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function weeklySummaryImpl(api: BusinessHours, config: Config, options?: { join?: boolean }): string[] | string {
  const lines: string[] = []
  for (const key of ORDER) {
    const todayISO = DateTime.now().setZone(config.timezone).set({ weekday: dayToLuxonWeekday(key) }).toISODate()!
    const slots = api.slotsOn(todayISO)
    if (slots.length === 0) {
      lines.push(`${formatDayName(key, { locale: config.locale })} closed`)
    } else {
      const parts = slots.map((s) => formatSlot(s, { locale: config.locale, timezone: config.timezone }))
      lines.push(`${formatDayName(key, { locale: config.locale })} ${parts.join(', ')}`)
    }
  }
  if (options?.join) return lines.join('\n')
  return lines
}

function dayToLuxonWeekday(day: WeekdayKey): number {
  return { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 }[day]
}


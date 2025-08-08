import { DateTime, Interval } from 'luxon'
import type {
  BusinessHours,
  CloseAt,
  Config,
  DateLike,
  OpenCloseWindow,
  SlotInput,
  WeekdayKey,
} from './types'
import { normalizeConfig, resolveDaySpecForDate } from './normalize'
import { dtFrom, toDate } from './tz'

type SlotRange = { open: DateTime; close: DateTime }

export function createBusinessHours(config: Config): BusinessHours {
  const cfg = normalizeConfig(config)
  const cache = new Map<string, Array<{ open: Date; close: Date }>>()
  const MAX_CACHE_DAYS = 14

  function slotsOn(date: DateLike): Array<{ open: Date; close: Date }> {
    const dt = dtFrom(date as any, cfg.timezone)
    const startOfDay = dt.startOf('day')
    const dateISO = startOfDay.toISODate()!
    const cached = cache.get(dateISO)
    if (cached) return cached
    const spec = resolveDaySpecForDate(dateISO, cfg)
    const ranges: SlotRange[] = []

    if (spec !== 'closed') {
      for (const s of spec) {
        if (s.open <= s.close) {
          // same-day
          ranges.push(rangeFor(startOfDay, s))
        } else {
          // overnight: split
          ranges.push(rangeFor(startOfDay, { open: s.open, close: '23:59' as any }))
          // note: next-day portion will be added when computing that day's slots via previous-day check below
        }
      }
    }

    // Include previous day's overnight spill into current day
    const prevDay = startOfDay.minus({ days: 1 }).startOf('day')
    const prevISO = prevDay.toISODate()!
    const prevSpec = resolveDaySpecForDate(prevISO, cfg)
    if (prevSpec !== 'closed') {
      for (const s of prevSpec) {
        if (s.open > s.close) {
          // spill from 00:00 to s.close on current date
          ranges.push(rangeFor(startOfDay, { open: '00:00' as any, close: s.close }))
        }
      }
    }

    const result = ranges
      .map((r) => ({ open: r.open.toJSDate(), close: r.close.toJSDate() }))
      .sort((a, b) => a.open.getTime() - b.open.getTime())

    // simple LRU behavior
    cache.set(dateISO, result)
    if (cache.size > MAX_CACHE_DAYS) {
      const firstKey = cache.keys().next().value as string | undefined
      if (firstKey) cache.delete(firstKey)
    }
    return result
  }

  function currentSlot(at?: DateLike): { open: Date; close: Date } | null {
    const now = dtFrom(at, cfg.timezone)
    const todays = slotsOn(now.toJSDate())
    for (const s of todays) {
      const o = DateTime.fromJSDate(s.open)
      const c = DateTime.fromJSDate(s.close)
      if (Interval.fromDateTimes(o, c).contains(now)) return s
    }
    return null
  }

  function isOpenAt(date: DateLike): boolean {
    return currentSlot(date) !== null
  }

  function isOpenNow(): boolean {
    return isOpenAt(dtFrom(undefined, cfg.timezone).toJSDate())
  }

  function nextOpen(from?: DateLike): OpenCloseWindow | null {
    const start = dtFrom(from, cfg.timezone)
    // check today first
    const todaySlots = slotsOn(start.toJSDate())
    for (const slot of todaySlots) {
      const o = DateTime.fromJSDate(slot.open)
      const c = DateTime.fromJSDate(slot.close)
      if (c <= start) continue
      if (start < o) return { start: o.toJSDate(), end: c.toJSDate() }
      if (Interval.fromDateTimes(o, c).contains(start)) return { start: start.toJSDate(), end: c.toJSDate() }
    }

    // look ahead up to 14 days (cache window)
    for (let i = 1; i <= 14; i++) {
      const day = start.plus({ days: i }).startOf('day')
      const slots = slotsOn(day.toJSDate())
      if (slots.length > 0) {
        return { start: slots[0].open, end: slots[0].close }
      }
    }
    return null
  }

  function nextClose(from?: DateLike): CloseAt | null {
    const start = dtFrom(from, cfg.timezone)
    const slot = currentSlot(start.toJSDate())
    if (slot) return { at: slot.close }

    const upcoming = nextOpen(start.toJSDate())
    if (!upcoming) return null
    return { at: upcoming.end }
  }

  function timeUntilClose(at?: DateLike): { ms: number; minutes: number } | null {
    const start = dtFrom(at, cfg.timezone)
    const slot = currentSlot(start.toJSDate())
    if (!slot) return null
    const diff = DateTime.fromJSDate(slot.close).diff(start).as('milliseconds')
    if (diff <= 0) return null
    return { ms: diff, minutes: Math.ceil(diff / 60000) }
  }

  function timeUntilOpen(at?: DateLike): { ms: number; minutes: number } | null {
    const start = dtFrom(at, cfg.timezone)
    if (currentSlot(start.toJSDate())) return { ms: 0, minutes: 0 }
    const upcoming = nextOpen(start.toJSDate())
    if (!upcoming) return null
    const diff = DateTime.fromJSDate(upcoming.start).diff(start).as('milliseconds')
    return { ms: diff, minutes: Math.ceil(diff / 60000) }
  }

  function todaysSlots(at?: DateLike): Array<{ open: Date; close: Date }> {
    const dt = dtFrom(at, cfg.timezone)
    return slotsOn(dt.toJSDate())
  }

  function weeklySummary(options?: { join?: boolean }): string[] | string {
    const lines: string[] = []
    const start = DateTime.now().setZone(cfg.timezone).startOf('week')
    for (let i = 0; i < 7; i++) {
      const day = start.plus({ days: i })
      const slots = slotsOn(day.toJSDate())
      if (slots.length === 0) {
        lines.push(`${day.toFormat('EEE')} closed`)
      } else {
        const parts = slots.map((s) => {
          const o = DateTime.fromJSDate(s.open).setZone(cfg.timezone)
          const c = DateTime.fromJSDate(s.close).setZone(cfg.timezone)
          return `${o.toFormat('HH:mm')}–${c.toFormat('HH:mm')}`
        })
        lines.push(`${day.toFormat('EEE')} ${parts.join(', ')}`)
      }
    }
    return options?.join ? lines.join('\n') : lines
  }

  function listUpcomingSlots(daysAhead = 14): Array<{ date: string; slots: Array<{ open: Date; close: Date }> }> {
    const now = DateTime.now().setZone(cfg.timezone).startOf('day')
    const out: Array<{ date: string; slots: Array<{ open: Date; close: Date }> }> = []
    for (let i = 0; i <= daysAhead; i++) {
      const day = now.plus({ days: i })
      const dateISO = day.toISODate()!
      const slots = slotsOn(day.toJSDate())
      out.push({ date: dateISO, slots })
    }
    return out
  }

  function withOverrides(overrides: Partial<Config>): BusinessHours {
    return createBusinessHours({ ...cfg, ...overrides })
  }

  function toJSONLocal(): Config {
    return {
      timezone: cfg.timezone,
      week: cfg.week,
      holidays: cfg.holidays,
      exceptions: cfg.exceptions,
      locale: cfg.locale,
      firstDayOfWeek: cfg.firstDayOfWeek,
      strictValidation: cfg.strictValidation,
    }
  }

  return {
    isOpenNow,
    isOpenAt,
    nextOpen,
    nextClose,
    currentSlot,
    timeUntilClose,
    timeUntilOpen,
    todaysSlots,
    slotsOn,
    weeklySummary,
    listUpcomingSlots,
    withOverrides,
    toJSON: toJSONLocal,
  }
}

function rangeFor(dayStart: DateTime, slot: SlotInput): { open: DateTime; close: DateTime } {
  const [oh, om] = slot.open.split(':').map(Number)
  const [ch, cm] = slot.close.split(':').map(Number)
  const open = dayStart.set({ hour: oh, minute: om, second: 0, millisecond: 0 })
  const close = dayStart.set({ hour: ch, minute: cm, second: 0, millisecond: 0 })
  return { open, close }
}


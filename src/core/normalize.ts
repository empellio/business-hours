import { DateTime } from 'luxon'
import type {
  Config,
  DaySpec,
  Exception,
  Holiday,
  SlotInput,
  WeekdayKey,
} from './types'
import { validateAndSortDay, splitOvernight } from '../helpers/mergeSlots'

const WEEK_KEYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export type NormalizedConfig = Required<Config>

export function normalizeConfig(input: Config): NormalizedConfig {
  const strict = Boolean(input.strictValidation)
  const locale = input.locale ?? 'en-US'
  const firstDayOfWeek = input.firstDayOfWeek ?? 'mon'
  const holidays = input.holidays ?? []
  const exceptions = input.exceptions ?? []

  const week: Record<WeekdayKey, DaySpec> = { ...input.week } as any
  for (const k of WEEK_KEYS) {
    if (!(k in week)) {
      if (strict) throw new Error(`Missing weekday: ${k}`)
      week[k] = 'closed'
    }
    const v = week[k]
    if (v !== 'closed') {
      week[k] = validateAndSortDay(v, strict)
    }
  }

  return {
    timezone: input.timezone,
    week: week as Record<WeekdayKey, DaySpec>,
    holidays,
    exceptions,
    locale,
    firstDayOfWeek,
    strictValidation: strict,
  }
}

export function dayKeyFromLuxon(dt: DateTime): WeekdayKey {
  // Luxon: Monday = 1 ... Sunday = 7
  const map: Record<number, WeekdayKey> = {
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat',
    7: 'sun',
  }
  return map[dt.weekday]
}

export function toJSON(config: Config): Config {
  return JSON.parse(JSON.stringify(config))
}

export function fromJSON(configLike: any): Config {
  return configLike as Config
}

export function resolveDaySpecForDate(
  dateISO: string,
  cfg: NormalizedConfig,
): DaySpec {
  // exceptions override holidays
  const ex = cfg.exceptions?.find((e) => e.date === dateISO)
  if (ex) return ex.closed ? 'closed' : ex.slots ?? 'closed'

  const hol = cfg.holidays?.find((h) => h.date === dateISO)
  if (hol) return hol.closed ? 'closed' : hol.slots ?? 'closed'

  // fallback to week
  const dt = DateTime.fromISO(dateISO, { zone: cfg.timezone })
  const key = dayKeyFromLuxon(dt)
  return cfg.week[key]
}

export function expandDaySlotsForDate(
  dateISO: string,
  cfg: NormalizedConfig,
): SlotInput[] {
  const spec = resolveDaySpecForDate(dateISO, cfg)
  if (spec === 'closed') return []
  const { sameDay, overnight } = splitOvernight(spec)

  // Overnight: split into end-of-day and next-day ranges in HH:MM space
  const expanded: SlotInput[] = [...sameDay]
  for (const s of overnight) {
    // part 1: dateISO from s.open to 24:00 -> represent as 23:59 for inclusivity
    expanded.push({ open: s.open, close: '23:59' as any })
    // part 2 handled on next date when computing actual Date ranges
  }
  return expanded
}


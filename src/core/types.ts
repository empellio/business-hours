export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type HHMM = `${number}${number}:${number}${number}`

export type SlotInput = { open: HHMM; close: HHMM }
export type DaySpec = 'closed' | SlotInput[]

export type Holiday = {
  date: string
  closed?: boolean
  slots?: SlotInput[]
  note?: string
}

export type Exception = {
  date: string
  closed?: boolean
  slots?: SlotInput[]
  note?: string
}

export type Config = {
  timezone: string
  week: Record<WeekdayKey, DaySpec>
  holidays?: Holiday[]
  exceptions?: Exception[]
  locale?: string
  firstDayOfWeek?: WeekdayKey
  strictValidation?: boolean
}

export type DateLike = Date | string

export type OpenCloseWindow = { start: Date; end: Date }
export type CloseAt = { at: Date }

export type BusinessHours = {
  isOpenNow(): boolean
  isOpenAt(date: DateLike): boolean
  nextOpen(from?: DateLike): OpenCloseWindow | null
  nextClose(from?: DateLike): CloseAt | null
  currentSlot(at?: DateLike): { open: Date; close: Date } | null
  timeUntilClose(at?: DateLike): { ms: number; minutes: number } | null
  timeUntilOpen(at?: DateLike): { ms: number; minutes: number } | null
  todaysSlots(at?: DateLike): Array<{ open: Date; close: Date }>
  slotsOn(date: DateLike): Array<{ open: Date; close: Date }>
  weeklySummary(options?: { join?: boolean }): string[] | string
  listUpcomingSlots(daysAhead?: number): Array<{
    date: string
    slots: Array<{ open: Date; close: Date }>
  }>
  withOverrides(overrides: Partial<Config>): BusinessHours
  toJSON(): Config
}


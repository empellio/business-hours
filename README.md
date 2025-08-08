## @empellio/business-hours

**A lightweight and accurate TypeScript library for handling business opening hours.** Supports multiple daily time slots, holidays, exceptions, overnight openings, and timezone-aware calculations. Runs in both Node.js and the browser. Perfect for scheduling, booking systems, e-commerce stores, and any application that needs to determine "open/closed" status and calculate time until next opening or closing.

### Installation

```bash
npm install @empellio/business-hours luxon
# or
yarn add @empellio/business-hours luxon
```

### Quick start

```ts
import { createBusinessHours } from '@empellio/business-hours'

const bh = createBusinessHours({
  timezone: 'Europe/Prague',
  week: {
    mon: [{ open: '09:00', close: '12:00' }, { open: '13:00', close: '17:00' }],
    tue: [{ open: '09:00', close: '17:00' }],
    wed: 'closed',
    thu: [{ open: '09:00', close: '17:00' }],
    fri: [{ open: '09:00', close: '15:00' }],
    sat: [{ open: '10:00', close: '14:00' }],
    sun: 'closed'
  },
  holidays: [
    { date: '2025-12-24', closed: true, note: 'Christmas Eve' },
    { date: '2025-12-31', slots: [{ open: '09:00', close: '12:00' }] }
  ],
  exceptions: [
    { date: '2025-08-20', closed: true, note: 'Inventory' },
    { date: '2025-08-22', slots: [{ open: '12:00', close: '20:00' }] }
  ],
  locale: 'en-US'
})

bh.isOpenNow()
bh.isOpenAt('2025-08-22T18:30:00Z')
bh.nextOpen()
bh.nextClose()
bh.timeUntilClose()
bh.timeUntilOpen()
bh.todaysSlots()
bh.weeklySummary()
```

### Configuration

```ts
type WeekdayKey = 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'
type HHMM = `${number}${number}:${number}${number}`

type SlotInput = { open: HHMM, close: HHMM }
type DaySpec = 'closed' | SlotInput[]

type Holiday = { date: string, closed?: boolean, slots?: SlotInput[], note?: string }
type Exception = { date: string, closed?: boolean, slots?: SlotInput[], note?: string }

type Config = {
  timezone: string
  week: Record<WeekdayKey, DaySpec>
  holidays?: Holiday[]
  exceptions?: Exception[]
  locale?: string
  firstDayOfWeek?: WeekdayKey
  strictValidation?: boolean
}
```

Validation rules:
- Check HH:MM format for open/close times
- Allow overnight slots (open > close)
- No overlapping slots in the same day (after overnight normalization)
- Exceptions override holidays
- `strictValidation: true` throws errors for invalid configs, `false` auto-corrects deterministically

### Overnight & DST handling

- Overnight slots are split internally into day-bound ranges
- All calculations are timezone-aware using Luxon
- DST changes are handled via Luxon's `setZone`

### API reference

- `createBusinessHours(config: Config): BusinessHours`
- `isOpenNow(): boolean`
- `isOpenAt(date: Date | string): boolean`
- `nextOpen(from?: Date | string): { start: Date, end: Date } | null`
- `nextClose(from?: Date | string): { at: Date } | null`
- `currentSlot(at?: Date | string): { open: Date, close: Date } | null`
- `timeUntilClose(at?: Date | string): { ms: number, minutes: number } | null`
- `timeUntilOpen(at?: Date | string): { ms: number, minutes: number } | null`
- `todaysSlots(at?: Date | string): Array<{ open: Date, close: Date }>`
- `slotsOn(date: Date | string): Array<{ open: Date, close: Date }>`
- `weeklySummary(options?): string[] | string`
- `listUpcomingSlots(daysAhead?: number): Array<{ date: string, slots: Array<{ open: Date, close: Date }> }>`
- `withOverrides(overrides: Partial<Config>): BusinessHours`

### Examples

Time until close
```ts
const res = bh.timeUntilClose()
// { ms: number, minutes: number } | null
```

Next open slot
```ts
const res = bh.nextOpen()
// { start: Date, end: Date } | null
```

Weekly summary
```ts
bh.weeklySummary()
// ["Mon 09:00–12:00, 13:00–17:00", ...]
```

### Performance tips

- The library precompiles weekly slots and caches recent days (LRU up to 14 days)
- Prefer reusing a single instance per config

### Changelog

- 0.1.0: Initial release



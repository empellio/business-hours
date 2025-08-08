import type { SlotInput } from '../core/types'
import { isHHMM, parseHHMM } from './parseHHMM'

type Slot = { open: string; close: string }

export function validateAndSortDay(slots: SlotInput[], strict: boolean): SlotInput[] {
  const valid: SlotInput[] = []
  for (const s of slots) {
    if (!isHHMM(s.open) || !isHHMM(s.close)) {
      if (strict) throw new Error(`Invalid HH:MM in slot ${s.open}-${s.close}`)
      else continue
    }
    valid.push({ open: s.open, close: s.close })
  }

  valid.sort((a, b) => (a.open < b.open ? -1 : a.open > b.open ? 1 : 0))

  // Merge overlapping or touching slots within the same day (ignoring overnight)
  const merged: SlotInput[] = []
  for (const s of valid) {
    const last = merged[merged.length - 1]
    if (!last) {
      merged.push(s)
      continue
    }
    if (s.open <= last.close) {
      // overlap or touch
      if (s.close > last.close) last.close = s.close as any
    } else {
      merged.push({ ...s })
    }
  }

  return merged
}

export function splitOvernight(slots: SlotInput[]): {
  sameDay: SlotInput[]
  overnight: SlotInput[]
} {
  const sameDay: SlotInput[] = []
  const overnight: SlotInput[] = []
  for (const s of slots) {
    if (s.open <= s.close) sameDay.push(s)
    else overnight.push(s)
  }
  return { sameDay, overnight }
}

export function addMinutesToHHMM(hhmm: string, minutesToAdd: number): string {
  const { hours, minutes } = parseHHMM(hhmm)
  const total = hours * 60 + minutes + minutesToAdd
  const norm = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(norm / 60)
  const m = norm % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}


import { describe, it, expect } from 'vitest'
import { createBusinessHours } from '../core/compute'

const base = {
  timezone: 'Europe/Prague',
  week: {
    mon: [{ open: '09:00', close: '17:00' }],
    tue: [{ open: '09:00', close: '17:00' }],
    wed: [{ open: '09:00', close: '17:00' }],
    thu: [{ open: '09:00', close: '17:00' }],
    fri: [{ open: '09:00', close: '17:00' }],
    sat: 'closed',
    sun: 'closed',
  },
  holidays: [
    { date: '2025-12-24', closed: true },
  ],
  exceptions: [
    { date: '2025-12-24', slots: [{ open: '10:00', close: '12:00' }] },
  ],
}

describe('holidays vs exceptions', () => {
  it('exception overrides holiday', () => {
    const bh = createBusinessHours(base)
    expect(bh.isOpenAt('2025-12-24T10:30:00+01:00')).toBe(true)
  })
})


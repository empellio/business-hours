import { describe, it, expect } from 'vitest'
import { createBusinessHours } from '../core/compute'

// Europe/Prague DST end around 2025-10-26: 03:00 becomes 02:00
// We'll assert open windows straddle the change without error

const base = {
  timezone: 'Europe/Prague',
  week: {
    mon: [{ open: '00:00', close: '23:59' }],
    tue: [{ open: '00:00', close: '23:59' }],
    wed: [{ open: '00:00', close: '23:59' }],
    thu: [{ open: '00:00', close: '23:59' }],
    fri: [{ open: '00:00', close: '23:59' }],
    sat: [{ open: '00:00', close: '23:59' }],
    sun: [{ open: '00:00', close: '23:59' }],
  },
}

describe('dst handling', () => {
  it('is open across DST transition', () => {
    const bh = createBusinessHours(base)
    expect(bh.isOpenAt('2025-10-26T01:30:00+02:00')).toBe(true)
    expect(bh.isOpenAt('2025-10-26T02:30:00+01:00')).toBe(true)
  })
})


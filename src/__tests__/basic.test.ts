import { describe, it, expect } from 'vitest'
import { createBusinessHours } from '../core/compute'

const base = {
  timezone: 'Europe/Prague',
  week: {
    mon: [
      { open: '09:00', close: '12:00' },
      { open: '13:00', close: '17:00' },
    ],
    tue: [{ open: '09:00', close: '17:00' }],
    wed: 'closed',
    thu: [{ open: '09:00', close: '17:00' }],
    fri: [{ open: '09:00', close: '15:00' }],
    sat: [{ open: '10:00', close: '14:00' }],
    sun: 'closed',
  },
}

describe('basic open/closed', () => {
  it('detects closed on wednesday', () => {
    const bh = createBusinessHours(base)
    expect(bh.isOpenAt('2025-08-20T10:00:00+02:00')).toBe(false)
  })
})


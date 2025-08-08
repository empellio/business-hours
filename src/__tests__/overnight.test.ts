import { describe, it, expect } from 'vitest'
import { createBusinessHours } from '../core/compute'

const base = {
  timezone: 'Europe/Prague',
  week: {
    mon: [{ open: '20:00', close: '02:00' }], // overnight
    tue: 'closed',
    wed: 'closed',
    thu: 'closed',
    fri: 'closed',
    sat: 'closed',
    sun: 'closed',
  },
}

describe('overnight', () => {
  it('is open after midnight into tuesday', () => {
    const bh = createBusinessHours(base)
    expect(bh.isOpenAt('2025-08-12T01:00:00+02:00')).toBe(true)
  })
})


import { describe, it, expect } from 'vitest'
import { createBusinessHours } from '../core/compute'
import { fromJSON } from '..'

const config = {
  timezone: 'Europe/Prague',
  week: {
    mon: [{ open: '09:00', close: '17:00' }],
    tue: 'closed',
    wed: [{ open: '09:00', close: '12:00' }],
    thu: [{ open: '09:00', close: '17:00' }],
    fri: [{ open: '09:00', close: '17:00' }],
    sat: 'closed',
    sun: 'closed',
  },
  exceptions: [{ date: '2025-08-20', closed: true }],
}

describe('serialization', () => {
  it('fromJSON creates a working instance', () => {
    const bh = fromJSON(config)
    expect(bh.isOpenAt('2025-08-18T10:00:00+02:00')).toBe(true)
  })
})


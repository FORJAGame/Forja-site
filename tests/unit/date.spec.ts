import { describe, expect, it } from 'vitest'

import { formatMonthYear } from '@/utilities/date'

describe('formatMonthYear', () => {
  it('writes the month and year in Portuguese', () => {
    expect(formatMonthYear('2026-09-01T00:00:00.000Z')).toBe('setembro de 2026')
  })

  it('does not shift the month with the server time zone', () => {
    expect(formatMonthYear('2026-01-01T00:00:00.000Z')).toBe('janeiro de 2026')
  })
})

import { describe, it, expect } from 'vitest'
import { formatPeopleList } from '../ui'

describe('formatPeopleList', () => {
  it('handles empty, one and two names', () => {
    expect(formatPeopleList([])).toBe('')
    expect(formatPeopleList(undefined)).toBe('')
    expect(formatPeopleList(['Ada'])).toBe('Ada')
    expect(formatPeopleList(['Ada', 'Charles'])).toBe('Ada & Charles')
  })

  it('names up to three people, then summarizes the rest', () => {
    expect(formatPeopleList(['A', 'B', 'C'])).toBe('A, B & C')
    expect(formatPeopleList(['A', 'B', 'C', 'D'])).toBe('A, B & 2 others')
  })
})

import { describe, it, expect } from 'vitest'
import { findDuplicatesWithin, findNearDuplicates } from '../dedupeHelpers'

const ev = (id, title, dateStart) => ({ id, title, dateStart })

describe('findDuplicatesWithin', () => {
  it('flags two same-date events with similar titles', () => {
    const events = [
      ev('a', 'Graduated from Harvard University', '1990-06-01'),
      ev('b', 'Graduated Harvard University', '1990-06-01'),
    ]
    const pairs = findDuplicatesWithin(events)
    expect(pairs).toHaveLength(1)
    expect([pairs[0].a.id, pairs[0].b.id].sort()).toEqual(['a', 'b'])
  })

  it('does not flag distinct events', () => {
    const events = [
      ev('a', 'Born in Boston', '1970-01-01'),
      ev('b', 'Moved to Chicago', '1985-04-01'),
      ev('c', 'Started new job', '1990-09-01'),
    ]
    expect(findDuplicatesWithin(events)).toHaveLength(0)
  })

  it('reports each unordered pair once and never pairs an event with itself', () => {
    const events = [
      ev('a', 'Wedding at the lake house', '2000-07-04'),
      ev('b', 'Wedding at the lake house', '2000-07-04'),
    ]
    const pairs = findDuplicatesWithin(events)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].a.id).not.toBe(pairs[0].b.id)
  })

  it('surfaces an event that duplicates two others as two separate pairs', () => {
    const events = [
      ev('a', 'Enlisted in the Army', '1943-03-01'),
      ev('b', 'Enlisted in the Army', '1943-03-01'),
      ev('c', 'Enlisted in the Army', '1943-03-01'),
    ]
    // a~b, a~c, b~c
    expect(findDuplicatesWithin(events)).toHaveLength(3)
  })

  it('does not flag short-title overlap when the dates are far apart', () => {
    // Same wording but decades apart — neither the same-date "definite" path
    // nor the within-60-days "likely" path applies.
    const events = [
      ev('a', 'Moved to New York', '1960-01-01'),
      ev('b', 'Moved to New York', '1995-01-01'),
    ]
    expect(findDuplicatesWithin(events)).toHaveLength(0)
  })

  it('returns an empty array for an empty timeline', () => {
    expect(findDuplicatesWithin([])).toEqual([])
  })
})

describe('findNearDuplicates (append flow, unchanged)', () => {
  it('matches an incoming event against an existing one', () => {
    const existing = [ev('x', 'Graduated from Harvard University', '1990-06-01')]
    const incoming = [ev('y', 'Graduated Harvard University', '1990-06-01')]
    const pairs = findNearDuplicates(incoming, existing)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].newEvent.id).toBe('y')
    expect(pairs[0].existing.id).toBe('x')
  })
})

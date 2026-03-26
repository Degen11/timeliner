import { describe, it, expect } from 'vitest'
import { eventSchema, looseEventSchema, parseLooseEvents } from '../event'

describe('eventSchema (strict)', () => {
  const validEvent = {
    id: 'evt_abc123',
    title: 'Born in Wisconsin',
    description: 'Grandfather was born on the family farm.',
    dateStart: '1928-01-01',
    dateEnd: null,
    dateRaw: '1928',
    datePrecision: 'year',
    flagged: true,
    flagReason: 'Year inferred',
    people: ['James Mitchell'],
    location: null,
    tags: ['family'],
    photos: [],
  }

  it('accepts a well-formed event', () => {
    const result = eventSchema.safeParse(validEvent)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validEvent)
  })

  it('rejects missing title', () => {
    const result = eventSchema.safeParse({ ...validEvent, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing id', () => {
    const result = eventSchema.safeParse({ ...validEvent, id: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = eventSchema.safeParse({ ...validEvent, dateStart: '03-15-2024' })
    expect(result.success).toBe(false)
  })

  it('accepts all precision values', () => {
    for (const p of ['day', 'month', 'year', 'decade', 'approximate']) {
      const result = eventSchema.safeParse({ ...validEvent, datePrecision: p })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid precision', () => {
    const result = eventSchema.safeParse({ ...validEvent, datePrecision: 'century' })
    expect(result.success).toBe(false)
  })

  it('applies defaults for optional fields', () => {
    const minimal = { id: 'evt_min', title: 'Minimal' }
    const result = eventSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    expect(result.data.description).toBeNull()
    expect(result.data.dateStart).toBeNull()
    expect(result.data.datePrecision).toBe('day')
    expect(result.data.flagged).toBe(false)
    expect(result.data.people).toEqual([])
    expect(result.data.tags).toEqual([])
    expect(result.data.photos).toEqual([])
  })
})

describe('looseEventSchema (coercive)', () => {
  it('coerces messy AI output to a clean event', () => {
    const messy = {
      title: 'Enlisted in Army',
      description: 42, // wrong type
      dateStart: '1946-04-01',
      dateEnd: undefined,
      datePrecision: 'MONTH', // wrong case
      flagged: 1,
      people: 'not an array',
      tags: ['military'],
    }
    const result = looseEventSchema.safeParse(messy)
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('Enlisted in Army')
    expect(result.data.description).toBeNull() // coerced from number
    expect(result.data.datePrecision).toBe('day') // fell back from invalid
    expect(result.data.flagged).toBe(true) // coerced from 1
    expect(result.data.people).toEqual([]) // coerced from string
    expect(result.data.tags).toEqual(['military']) // kept valid array
  })

  it('returns null for events without a title', () => {
    const result = looseEventSchema.safeParse({ description: 'no title here' })
    expect(result.success).toBe(true)
    expect(result.data).toBeNull()
  })

  it('strips non-string items from arrays', () => {
    const result = looseEventSchema.safeParse({
      title: 'Test',
      people: ['Alice', 42, null, 'Bob'],
      tags: [true, 'family'],
    })
    expect(result.success).toBe(true)
    expect(result.data.people).toEqual(['Alice', 'Bob'])
    expect(result.data.tags).toEqual(['family'])
  })

  it('rejects invalid ISO dates in dateStart/dateEnd', () => {
    const result = looseEventSchema.safeParse({
      title: 'Bad dates',
      dateStart: 'March 2024',
      dateEnd: '2024/06/15',
    })
    expect(result.success).toBe(true)
    expect(result.data.dateStart).toBeNull()
    expect(result.data.dateEnd).toBeNull()
  })
})

describe('parseLooseEvents', () => {
  it('parses an array of loose events', () => {
    const events = parseLooseEvents([
      { title: 'Event 1', dateStart: '2024-01-01' },
      { title: 'Event 2', dateStart: '2024-06-15' },
    ])
    expect(events).toHaveLength(2)
    expect(events[0].title).toBe('Event 1')
  })

  it('handles { events: [...] } wrapper', () => {
    const events = parseLooseEvents({
      events: [{ title: 'Wrapped', dateStart: '2024-01-01' }],
    })
    expect(events).toHaveLength(1)
  })

  it('filters out titleless events', () => {
    const events = parseLooseEvents([
      { title: 'Good', dateStart: '2024-01-01' },
      { description: 'No title' },
      { title: '', dateStart: '2024-06-01' },
    ])
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Good')
  })

  it('returns empty array for non-array input', () => {
    expect(parseLooseEvents('bad')).toEqual([])
    expect(parseLooseEvents(null)).toEqual([])
    expect(parseLooseEvents(42)).toEqual([])
  })
})

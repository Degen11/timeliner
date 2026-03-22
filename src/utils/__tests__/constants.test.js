import { describe, it, expect } from 'vitest'
import {
  VIEWS,
  MOTION_DURATION,
  SPRING,
  EASE_OUT,
  CARD_STYLE,
  getEventColor,
  getTagPalette,
  getTagStyle,
  getTagDarkStyle,
  escapeHtml,
  generateId,
} from '../constants'

describe('VIEWS', () => {
  it('defines all 5 view types', () => {
    expect(Object.keys(VIEWS)).toHaveLength(5)
    expect(VIEWS.VERTICAL).toBe('vertical')
    expect(VIEWS.HORIZONTAL).toBe('horizontal')
    expect(VIEWS.GRID).toBe('grid')
    expect(VIEWS.MAP).toBe('map')
    expect(VIEWS.GRAPH).toBe('graph')
  })
})

describe('MOTION_DURATION', () => {
  it('defines timing constants in ascending order', () => {
    expect(MOTION_DURATION.INSTANT).toBeLessThan(MOTION_DURATION.FAST)
    expect(MOTION_DURATION.FAST).toBeLessThan(MOTION_DURATION.NORMAL)
    expect(MOTION_DURATION.NORMAL).toBeLessThan(MOTION_DURATION.SLOW)
  })
})

describe('SPRING', () => {
  it('defines three spring presets', () => {
    expect(SPRING.GENTLE.type).toBe('spring')
    expect(SPRING.SNAPPY.type).toBe('spring')
    expect(SPRING.BOUNCY.type).toBe('spring')
  })

  it('GENTLE has less bounce than BOUNCY', () => {
    expect(SPRING.GENTLE.bounce).toBeLessThan(SPRING.BOUNCY.bounce)
  })
})

describe('EASE_OUT', () => {
  it('is a 4-element cubic bezier array', () => {
    expect(EASE_OUT).toHaveLength(4)
    expect(EASE_OUT.every((n) => typeof n === 'number')).toBe(true)
  })
})

describe('CARD_STYLE', () => {
  it('has base, hover, and transition properties', () => {
    expect(CARD_STYLE.base).toContain('rounded-xl')
    expect(CARD_STYLE.hover).toContain('hover:')
    expect(CARD_STYLE.transition).toContain('transition')
  })
})

describe('getTagPalette', () => {
  it('returns palette for built-in tags', () => {
    const career = getTagPalette('career')
    expect(career.name).toBe('sapphire')
    expect(career.bg).toBeTruthy()
    expect(career.text).toBeTruthy()
  })

  it('returns palette for unknown tags (custom)', () => {
    const custom = getTagPalette('my-custom-tag')
    expect(custom.bg).toBeTruthy()
    expect(custom.text).toBeTruthy()
  })
})

describe('getTagStyle', () => {
  it('returns bg, color, and borderColor for light mode', () => {
    const style = getTagStyle('education')
    expect(style.backgroundColor).toBeTruthy()
    expect(style.color).toBeTruthy()
    expect(style.borderColor).toBeTruthy()
  })
})

describe('getTagDarkStyle', () => {
  it('returns dark mode variants', () => {
    const style = getTagDarkStyle('travel')
    expect(style.backgroundColor).toContain('rgba')
    expect(style.color).toBeTruthy()
  })
})

describe('getEventColor', () => {
  it('returns dot, light, stroke for tagged event', () => {
    const color = getEventColor({ tags: ['career'] })
    expect(color.dot).toBeTruthy()
    expect(color.light).toBeTruthy()
    expect(color.stroke).toBeTruthy()
  })

  it('returns default color for untagged event', () => {
    const color = getEventColor({ tags: [] })
    expect(color.dot).toBe('#525252')
  })

  it('handles missing tags gracefully', () => {
    const color = getEventColor({})
    expect(color.dot).toBeTruthy()
  })
})

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml('<script>"alert"</script>')).toBe('&lt;script&gt;&quot;alert&quot;&lt;/script&gt;')
  })

  it('handles null/undefined', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('handles ampersand', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B')
  })
})

describe('generateId', () => {
  it('creates evt_ prefixed IDs', () => {
    const id = generateId()
    expect(id).toMatch(/^evt_[a-f0-9-]{12}$/)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()))
    expect(ids.size).toBe(50)
  })
})

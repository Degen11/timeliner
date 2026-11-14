import { describe, it, expect } from 'vitest'
import { splitTextIntoChunks } from '../chunkText'

const para = (n, len = 90) => `Paragraph ${n}. ` + 'word '.repeat(Math.floor(len / 5))

describe('splitTextIntoChunks', () => {
  it('returns short text as one chunk and empty text as none', () => {
    expect(splitTextIntoChunks('In 1990 she moved.', 100)).toEqual(['In 1990 she moved.'])
    expect(splitTextIntoChunks('', 100)).toEqual([])
  })

  it('keeps every chunk under the limit and loses no text', () => {
    const text = Array.from({ length: 40 }, (_, i) => para(i)).join('\n\n')
    const chunks = splitTextIntoChunks(text, 500)
    expect(chunks.length).toBeGreaterThan(1)
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(500)
    expect(chunks.join('')).toBe(text)
  })

  it('cuts on paragraph breaks when there are any', () => {
    const text = Array.from({ length: 20 }, (_, i) => para(i)).join('\n\n')
    const chunks = splitTextIntoChunks(text, 400)
    for (const c of chunks.slice(0, -1)) expect(c.endsWith('\n\n')).toBe(true)
  })

  it('falls back to sentences, then spaces, then a hard cut', () => {
    const sentences = 'She was born in 1950. '.repeat(50)
    for (const c of splitTextIntoChunks(sentences, 200).slice(0, -1)) {
      expect(c.endsWith('. ')).toBe(true)
    }
    const oneWord = 'x'.repeat(1050)
    const hard = splitTextIntoChunks(oneWord, 500)
    expect(hard.map((c) => c.length)).toEqual([500, 500, 50])
  })
})

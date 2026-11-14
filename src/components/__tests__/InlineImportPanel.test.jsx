import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/Tooltip'

// Store mock: the panel reads draftText and the event actions through
// individual selectors, and getState() for duplicate detection.
let state
const makeState = (overrides = {}) => ({
  draftText: 'In 1990 Ana moved to Lisbon. In 1995 she started a bakery.',
  events: [],
  timelines: [{ id: 'tl_1', name: 'Mine' }],
  activeTimelineId: 'tl_1',
  isParsing: false,
  parseError: null,
  photoMap: {},
  setDraftText: vi.fn((t) => { state.draftText = t }),
  setIsParsing: vi.fn(),
  setParseError: vi.fn(),
  setEvents: vi.fn(),
  appendEvents: vi.fn(() => ({ duplicatesSkipped: 0 })),
  addToPhotoMap: vi.fn(),
  createNewTimeline: vi.fn(),
  showToast: vi.fn(),
  ...overrides,
})
vi.mock('@/store/useTimelineStore', () => {
  const hook = (selector) => selector(state)
  hook.getState = () => state
  return { default: hook }
})
vi.mock('@/lib/photoSync', () => ({ getRemotePhotoUrl: vi.fn(() => Promise.resolve(null)) }))

import InlineImportPanel from '../timeline/InlineImportPanel'

const PARSED = [
  { id: 'evt_a', title: 'Moved to Lisbon', dateStart: '1990', datePrecision: 'year', people: ['Ana'], tags: [], photos: [], flagged: false },
  { id: 'evt_b', title: 'Opened a bakery', dateStart: '1995', datePrecision: 'year', people: ['Ana'], tags: [], photos: [], flagged: false },
]

const renderPanel = () => render(<InlineImportPanel />, { wrapper: TooltipProvider })

beforeEach(() => {
  state = makeState()
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ events: PARSED, truncated: false }),
  })))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// The overlay reveals events one by one and keeps its confirm button disabled
// until all of them are shown
async function waitForConfirm(name = /Add 2 events to timeline/i) {
  const button = await screen.findByRole('button', { name }, { timeout: 5000 })
  await waitFor(() => expect(button).toBeEnabled(), { timeout: 5000 })
  return button
}

async function parseAndOpenReview() {
  fireEvent.click(screen.getAllByRole('button', { name: /Generate Timeline/i })[0])
  return waitForConfirm()
}

describe('InlineImportPanel review gate', () => {
  it('does not commit parsed events until the review is confirmed', async () => {
    renderPanel()
    const confirm = await parseAndOpenReview()
    expect(fetch).toHaveBeenCalledWith('/api/parse', expect.objectContaining({ method: 'POST' }))
    expect(state.setEvents).not.toHaveBeenCalled()
    expect(state.appendEvents).not.toHaveBeenCalled()

    fireEvent.click(confirm)
    expect(state.setEvents).toHaveBeenCalledWith(PARSED)
    expect(state.appendEvents).not.toHaveBeenCalled()
  })

  it('commits only the events left included', async () => {
    renderPanel()
    await parseAndOpenReview()
    fireEvent.click(screen.getAllByRole('button', { name: 'Exclude event' })[0])
    fireEvent.click(await waitForConfirm(/Add 1 event to timeline/i))
    expect(state.setEvents).toHaveBeenCalledWith([PARSED[1]])
  })

  it('commits nothing when the review is cancelled', async () => {
    renderPanel()
    await parseAndOpenReview()
    fireEvent.click(screen.getAllByRole('button', { name: /^Cancel$/ })[0])
    await waitFor(() => expect(screen.queryByRole('button', { name: /Add 2 events/ })).toBeNull())
    expect(state.setEvents).not.toHaveBeenCalled()
    expect(state.appendEvents).not.toHaveBeenCalled()
  })

  it('appends instead of replacing when the timeline already has events', async () => {
    state = makeState({
      events: [{ id: 'evt_old', title: 'Born', dateStart: '1970', people: [], tags: [], photos: [] }],
    })
    renderPanel()
    const add = screen.getAllByRole('button').find((b) => /Add to timeline|Add events|Generate/i.test(b.textContent))
    fireEvent.click(add)
    fireEvent.click(await waitForConfirm())
    expect(state.appendEvents).toHaveBeenCalledWith(PARSED)
    expect(state.setEvents).not.toHaveBeenCalled()
  })
})

function ndjson(lines) {
  const bytes = new TextEncoder().encode(lines.map((l) => JSON.stringify(l)).join('\n') + '\n')
  let sent = false
  return {
    ok: true,
    headers: { get: () => 'application/x-ndjson' },
    body: {
      getReader: () => ({
        read: () => {
          if (sent) return Promise.resolve({ value: undefined, done: true })
          sent = true
          return Promise.resolve({ value: bytes, done: false })
        },
      }),
    },
  }
}

describe('InlineImportPanel streaming import', () => {
  it('fills the review from a streamed reply', async () => {
    fetch.mockImplementation(() => Promise.resolve(ndjson([
      ...PARSED.map((event) => ({ type: 'event', event })),
      { type: 'done', truncated: false, count: 2 },
    ])))
    renderPanel()
    const confirm = await parseAndOpenReview()
    expect(JSON.parse(fetch.mock.calls[0][1].body).stream).toBe(true)
    fireEvent.click(confirm)
    expect(state.setEvents).toHaveBeenCalledWith(PARSED)
  })

  it('splits long text into several requests and drops an event found twice', async () => {
    const paragraph = 'In 1990 Ana moved to Lisbon and worked in a small bakery near the river. '.repeat(20)
    state = makeState({ draftText: Array.from({ length: 60 }, () => paragraph).join('\n\n') })
    let call = 0
    fetch.mockImplementation(() => {
      call++
      // Every part "finds" Lisbon; only the first part also finds the bakery
      const events = [{ ...PARSED[0], id: `evt_lisbon_${call}` }]
      if (call === 1) events.push(PARSED[1])
      return Promise.resolve(ndjson([
        ...events.map((event) => ({ type: 'event', event })),
        { type: 'done', truncated: false, count: events.length },
      ]))
    })
    renderPanel()
    fireEvent.click(screen.getAllByRole('button', { name: /Generate Timeline/i })[0])
    const confirm = await waitForConfirm()
    expect(fetch.mock.calls.length).toBeGreaterThan(1)
    for (const [, init] of fetch.mock.calls) {
      expect(JSON.parse(init.body).text.length).toBeLessThanOrEqual(40_000)
    }
    fireEvent.click(confirm)
    expect(state.setEvents.mock.calls[0][0].map((e) => e.title)).toEqual(['Moved to Lisbon', 'Opened a bakery'])
  })

  it('shows the error when every part fails', async () => {
    fetch.mockImplementation(() => Promise.resolve({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Rate limit exceeded. Try again in 30 seconds.' }),
    }))
    renderPanel()
    fireEvent.click(screen.getAllByRole('button', { name: /Generate Timeline/i })[0])
    await waitFor(() => expect(state.setParseError).toHaveBeenCalledWith('Rate limit exceeded. Try again in 30 seconds.'))
  })
})

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
vi.mock('@/lib/photoSync', () => ({ getSignedUrl: vi.fn(() => Promise.resolve(null)) }))

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

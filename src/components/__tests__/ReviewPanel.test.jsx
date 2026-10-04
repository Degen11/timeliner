import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { create } from 'zustand'
import { TooltipProvider } from '@/components/ui/Tooltip'

const makeEvent = (id, title, dateStart, extra = {}) => ({
  id,
  title,
  description: null,
  dateStart,
  dateEnd: null,
  dateRaw: null,
  datePrecision: 'day',
  flagged: true,
  flagReason: 'Day inferred from context',
  people: [],
  tags: [],
  photos: [],
  ...extra,
})

// Minimal real store so updates re-render the panel like the app does
const store = create((set, get) => ({
  events: [],
  reviewMode: true,
  toggleReviewMode: () => set({ reviewMode: !get().reviewMode }),
  updateEvent: (id, patch) =>
    set({ events: get().events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),
}))
vi.mock('@/store/useTimelineStore', () => ({ default: (sel) => store(sel) }))

const { default: ReviewPanel } = await import('@/components/review/ReviewPanel')

const renderPanel = () => render(<ReviewPanel />, { wrapper: TooltipProvider })

describe('ReviewPanel', () => {
  beforeEach(() => {
    store.setState({
      reviewMode: true,
      events: [
        makeEvent('a', 'General relativity', '1915-11-01', { dateRaw: 'later that autumn, in 1915' }),
        makeEvent('b', 'Marries Mileva Maric', '1903-01-06'),
      ],
    })
  })

  it('shows one flagged date at a time with the source text and choices', () => {
    renderPanel()
    expect(screen.getByText('General relativity')).toBeInTheDocument()
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByText('“later that autumn, in 1915”')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /November 1, 1915/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /November 1915/ })).toBeInTheDocument()
  })

  it('applies the chosen precision and clears the flag on confirm', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('radio', { name: /Only the year is certain/ }))
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Confirm/ }))
    })
    const updated = store.getState().events.find((e) => e.id === 'a')
    expect(updated).toMatchObject({ dateStart: '1915', datePrecision: 'year', flagged: false, flagReason: null })
  })

  it('reaches the done state after skipping one and confirming the last (no crash)', async () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }))
    expect(await screen.findByText('Marries Mileva Maric')).toBeInTheDocument()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Confirm/ }))
    })
    expect(await screen.findByText('That’s everything for now')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go through skipped' })).toBeInTheDocument()
  })
})

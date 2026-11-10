import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const openEventDetail = vi.fn()
vi.mock('@/store/useTimelineStore', () => ({
  default: { getState: () => ({ openEventDetail }) },
}))
vi.mock('@/utils/haptics', () => ({ haptic: vi.fn() }))

import useCardClick from '../useCardClick'

const event = { id: 'evt_1', title: 'Moved to Paris' }
const clickOn = (el = document.createElement('div')) => ({ target: el })

beforeEach(() => {
  openEventDetail.mockClear()
})

describe('useCardClick', () => {
  it('opens the detail view on click, like EventCard', () => {
    const onEdit = vi.fn()
    const { result } = renderHook(() => useCardClick(event, { editable: true, onEdit }))
    result.current.handleClick(clickOn())
    expect(openEventDetail).toHaveBeenCalledWith(event)
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('does not open the editor on double-click outside select mode', () => {
    const onEdit = vi.fn()
    const { result } = renderHook(() => useCardClick(event, { editable: true, onEdit }))
    result.current.handleDoubleClick()
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('does nothing on click when the card is not editable (shared view)', () => {
    const { result } = renderHook(() => useCardClick(event, { editable: false }))
    result.current.handleClick(clickOn())
    expect(openEventDetail).not.toHaveBeenCalled()
  })

  it('ignores clicks on photos', () => {
    const wrap = document.createElement('div')
    wrap.setAttribute('data-photo-click', '')
    const img = document.createElement('img')
    wrap.appendChild(img)
    const { result } = renderHook(() => useCardClick(event, { editable: true }))
    result.current.handleClick(clickOn(img))
    expect(openEventDetail).not.toHaveBeenCalled()
  })

  it('selects on click and edits on double-click in select mode', () => {
    const onEdit = vi.fn()
    const onSelect = vi.fn()
    const { result } = renderHook(() => useCardClick(event, { editable: true, onEdit, onSelect }))
    result.current.handleClick(clickOn())
    expect(onSelect).toHaveBeenCalledWith('evt_1')
    expect(openEventDetail).not.toHaveBeenCalled()
    result.current.handleDoubleClick()
    expect(onEdit).toHaveBeenCalledWith(event)
  })
})

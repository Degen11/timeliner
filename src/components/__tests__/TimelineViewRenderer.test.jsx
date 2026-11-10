import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// The editor and the shared-link page both render views through this
// dispatcher, so both get the per-view error boundary and the read-only flag
const gridProps = vi.fn()
vi.mock('../timeline/VerticalView', () => ({
  default: () => {
    throw new Error('vertical exploded')
  },
}))
vi.mock('../timeline/HorizontalView', () => ({ default: () => <div>horizontal</div> }))
vi.mock('../timeline/GridView', () => ({
  default: (props) => {
    gridProps(props)
    return <div>grid</div>
  },
}))

import TimelineViewRenderer from '../timeline/TimelineViewRenderer'

describe('TimelineViewRenderer', () => {
  it('contains a crashing view in its error boundary', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<TimelineViewRenderer activeView="vertical" events={[]} />)
    expect(screen.getByText('View failed to render')).toBeInTheDocument()
    expect(screen.getByText('vertical exploded')).toBeInTheDocument()
    errorSpy.mockRestore()
  })

  it('is editable by default (the editor)', () => {
    render(<TimelineViewRenderer activeView="grid" events={[]} />)
    expect(gridProps).toHaveBeenLastCalledWith(expect.objectContaining({ editable: true }))
  })

  it('passes editable={false} through for the read-only shared page', () => {
    render(<TimelineViewRenderer activeView="grid" events={[]} editable={false} />)
    expect(gridProps).toHaveBeenLastCalledWith(expect.objectContaining({ editable: false }))
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterChips from '@/components/filters/FilterChips'

const options = ['Ada', 'Bea', 'Cy', 'Dee']
const counts = { Ada: 1, Bea: 5, Cy: 3, Dee: 2 }

describe('FilterChips', () => {
  it('shows the most-used options inline and hides the rest behind "N more"', () => {
    render(
      <FilterChips label="People" options={options} selected={[]} onChange={() => {}} counts={counts} maxVisible={2} />
    )
    expect(screen.getByRole('button', { name: 'Filter by Bea' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter by Cy' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Filter by Ada' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show all people (2 more)' })).toHaveTextContent('+2')
  })

  it('puts selected options first so they never hide behind "+N"', () => {
    render(
      <FilterChips label="People" options={options} selected={['Ada']} onChange={() => {}} counts={counts} maxVisible={2} />
    )
    const chips = screen.getAllByRole('button', { pressed: undefined }).filter((b) => b.hasAttribute('aria-pressed'))
    expect(chips[0]).toHaveAccessibleName('Remove filter: Ada')
    expect(chips[0]).toHaveAttribute('aria-pressed', 'true')
    expect(chips[1]).toHaveAccessibleName('Filter by Bea')
    expect(screen.getByRole('button', { name: 'Show all people (2 more)' })).toHaveTextContent('+2')
  })

  it('adds and removes options on click', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <FilterChips label="Tags" options={options} selected={[]} onChange={onChange} counts={counts} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filter by Cy' }))
    expect(onChange).toHaveBeenLastCalledWith(['Cy'])

    rerender(<FilterChips label="Tags" options={options} selected={['Cy', 'Dee']} onChange={onChange} counts={counts} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Cy' }))
    expect(onChange).toHaveBeenLastCalledWith(['Dee'])
  })

  it('renders nothing without options', () => {
    const { container } = render(<FilterChips label="Tags" options={[]} selected={[]} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '../shared/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>career</Badge>)
    expect(screen.getByText('career')).toBeInTheDocument()
  })

  it('applies default variant styling', () => {
    const { container } = render(<Badge>test</Badge>)
    const badge = container.firstChild
    expect(badge.className).toContain('rounded-full')
  })

  it('applies people variant with user icon', () => {
    const { container } = render(<Badge variant="accent">John</Badge>)
    const badge = container.firstChild
    expect(badge.className).toContain('rounded-lg')
    // People badge uses UserRound icon
    expect(badge.querySelector('svg')).toBeInTheDocument()
  })

  it('renders tag variant with inline styles', () => {
    const { container } = render(<Badge variant="career">career</Badge>)
    const badge = container.firstChild
    // Tag badges get inline styles from the palette
    expect(badge.style.backgroundColor).toBeTruthy()
    expect(badge.style.color).toBeTruthy()
  })

  it('renders remove button when onRemove is provided', () => {
    const onRemove = vi.fn()
    render(<Badge onRemove={onRemove}>removable</Badge>)
    const removeBtn = screen.getByLabelText('Remove')
    expect(removeBtn).toBeInTheDocument()
  })

  it('applies small size classes', () => {
    const { container } = render(<Badge small>small</Badge>)
    const badge = container.firstChild
    expect(badge.className).toContain('px-1.5')
  })

  it('applies truncation with title attribute', () => {
    const { container } = render(<Badge>long tag name</Badge>)
    // title is on the outer span wrapper
    const outerBadge = container.firstChild
    expect(outerBadge).toHaveAttribute('title', 'long tag name')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TagPicker from '@/components/shared/TagPicker'
import PeopleInput from '@/components/shared/PeopleInput'
import usePeopleAutocomplete from '@/hooks/usePeopleAutocomplete'

describe('TagPicker', () => {
  const base = {
    allTagOptions: ['career', 'education', 'family', 'milestone', 'personal', 'travel'],
    newTag: '',
    onNewTagChange: () => {},
    onAddCustomTag: () => {},
  }

  it('shows selected tags as removable chips and suggests the most-used others', () => {
    const onToggleTag = vi.fn()
    render(
      <TagPicker
        {...base}
        selectedTags={['personal']}
        onToggleTag={onToggleTag}
        tagCounts={{ travel: 9, career: 5, family: 1 }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag personal' }))
    expect(onToggleTag).toHaveBeenLastCalledWith('personal')

    const suggested = screen.getAllByRole('button', { name: /^Add tag/ }).map((b) => b.textContent)
    expect(suggested).toEqual(['travel', 'career', 'family', 'education'])
    expect(screen.queryByRole('button', { name: 'Add tag personal' })).not.toBeInTheDocument()
  })
})

function PeopleHarness({ initial = '', onValue }) {
  const [value, setValue] = useState(initial)
  const people = usePeopleAutocomplete(['Ada Lovelace', 'Charles Babbage'])
  const update = (v) => {
    setValue((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      onValue?.(next)
      return next
    })
  }
  return <PeopleInput people={people} value={value} onChange={update} variant="chips" id="people" />
}

describe('PeopleInput chips', () => {
  it('renders committed names as chips and keeps the draft in the input', () => {
    render(<PeopleHarness initial="Ada Lovelace, Charles Babbage, " />)
    expect(screen.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Charles Babbage' })).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('commits the draft on Enter and removes the last chip on Backspace', () => {
    const onValue = vi.fn()
    render(<PeopleHarness initial="Ada Lovelace, " onValue={onValue} />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'Grace Hopper' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onValue).toHaveBeenLastCalledWith('Ada Lovelace, Grace Hopper, ')
    expect(screen.getByRole('button', { name: 'Remove Grace Hopper' })).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onValue).toHaveBeenLastCalledWith('Ada Lovelace, ')
    expect(screen.queryByRole('button', { name: 'Remove Grace Hopper' })).not.toBeInTheDocument()
  })
})

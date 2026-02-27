import { useRef, useEffect } from 'react'

export default function TextInput({ value, onChange }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="timeline-input" className="text-sm font-medium text-gray-900">
        Paste your text
      </label>
      <textarea
        ref={textareaRef}
        id="timeline-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste journal entries, family history, research notes, biographical text…\n\nExample:\nMy grandfather moved to Chicago in the summer of 1952. He met my grandmother at a dance in March 1954. They were married on June 15, 1955. Their first child was born in early 1957.`}
        className="min-h-[280px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 resize-y transition-all"
      />
    </div>
  )
}

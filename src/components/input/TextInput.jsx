import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MAX_TEXT_LENGTH } from '@/utils/constants'

export default function TextInput({ value, onChange, onSubmit, disabled, onTrySample, autoFocus = true }) {
  const textareaRef = useRef(null)

  const autoGrow = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(120, Math.min(el.scrollHeight, 480)) + 'px'
  }

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
    autoGrow()
  }, [autoFocus])

  useEffect(() => {
    autoGrow()
  }, [value])

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !disabled) {
      e.preventDefault()
      onSubmit?.()
    }
  }

  const charCount = value.length
  const isOverLimit = charCount > MAX_TEXT_LENGTH
  const showCounter = charCount > MAX_TEXT_LENGTH * 0.8

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="timeline-input" className="text-sm font-medium text-text-strong">
            Paste your text
          </label>
          {onTrySample && !value && (
            <button
              type="button"
              onClick={onTrySample}
              className="text-xs text-secondary hover:underline cursor-pointer"
            >
              Try sample text
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter to submit
        </span>
      </div>
      <textarea
        ref={textareaRef}
        id="timeline-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Paste journal entries, family history, research notes, biographical text\u2026\n\nExample:\nMy grandfather moved to Chicago in the summer of 1952. He met my grandmother at a dance in March 1954. They were married on June 15, 1955.`}
        className={`w-full rounded-xl border bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm text-text-default placeholder:text-text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10 resize-y transition-all ${
          isOverLimit ? 'border-error focus:border-error focus:ring-error/10' : 'border-gray-200'
        }`}
        style={{ minHeight: '120px' }}
      />
      <AnimatePresence>
        {showCounter && (
          <motion.div
            className={`text-xs text-right ${isOverLimit ? 'text-error font-medium' : 'text-gray-400'}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {charCount.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()} characters
            {isOverLimit && ' \u2014 text is too long'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

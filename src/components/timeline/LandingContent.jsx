import { useState } from 'react'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { ArrowRight, Sparkles, RotateCcw, Type, FileUp, ClipboardPaste, Share2 } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import Button from '@/components/shared/Button'
import InlineImportPanel from './InlineImportPanel'
import FileImportContent from './FileImportContent'

const DEMO_EVENTS = [
  { date: 'Mar 2024', title: 'Started the project', color: 'bg-secondary' },
  { date: 'Jun 2024', title: 'First user milestone', color: 'bg-highlight' },
  { date: 'Sep 2024', title: 'Public launch day', color: 'bg-success' },
  { date: 'Dec 2024', title: 'Year in review', color: 'bg-error' },
]

function AnimatedDemoTimeline() {
  return (
    <div className="relative flex flex-col gap-0 py-2">
      <motion.div
        className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-secondary/20 rounded-full origin-top"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {DEMO_EVENTS.map((evt, i) => (
        <motion.div
          key={i}
          className="relative flex items-start gap-4 py-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.4, ease: 'easeOut' }}
        >
          <motion.div
            className={`relative z-10 mt-1 h-[23px] w-[23px] rounded-full ${evt.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5, delay: 0.4 + i * 0.4, bounce: 0.4 }}
          >
            <div className="h-2 w-2 rounded-full bg-white" />
          </motion.div>
          <motion.div
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex-1 min-w-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.4 }}
          >
            <span className="text-[11px] font-medium text-secondary/70 uppercase tracking-wider">
              {evt.date}
            </span>
            <p className="text-sm font-semibold text-text-strong leading-tight mt-0.5">
              {evt.title}
            </p>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

export default function LandingContent({ onActivate }) {
  const events = useTimelineStore((s) => s.events)
  const hasEvents = events.length > 0
  const [inputTab, setInputTab] = useState('text')

  return (
    <div className="flex flex-col items-center min-h-[60vh] py-4">
      <div className="max-w-5xl w-full">
        <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden mb-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="px-6 py-8 lg:px-10 lg:py-10 bg-gray-50 lg:border-r border-b lg:border-b-0 border-gray-200">
              <motion.p
                className="text-[11px] font-semibold text-secondary uppercase tracking-widest mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                How it works
              </motion.p>
              <AnimatedDemoTimeline />
              <motion.div
                className="flex flex-wrap gap-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 2.2 }}
              >
                <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                  No account required
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                  Works with messy notes
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                  Export anytime
                </span>
              </motion.div>
            </div>

            <div className="px-6 py-8 lg:px-10 lg:py-10 flex flex-col justify-center">
              <motion.h2
                className="font-display text-3xl lg:text-4xl font-bold text-text-strong tracking-tight leading-tight"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Turn text into a&nbsp;timeline
              </motion.h2>
              <motion.p
                className="text-base text-text-muted leading-relaxed mt-3 max-w-md"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                Paste journal entries, family history, research notes, or anything with dates. AI
                extracts events, people, and relationships into an interactive timeline.
              </motion.p>

              <motion.div
                className="mt-6 flex flex-col gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <ClipboardPaste size={16} className="text-secondary shrink-0" />
                  <span>Paste any text with dates</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Sparkles size={16} className="text-secondary shrink-0" />
                  <span>AI extracts events &amp; people automatically</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Share2 size={16} className="text-secondary shrink-0" />
                  <span>Edit, filter, and share your timeline</span>
                </div>
              </motion.div>

              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Button
                  size="lg"
                  onClick={() => {
                    document.getElementById('landing-input')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <ArrowRight size={16} />
                  Get Started
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {hasEvents && (
          <div className="rounded-xl bg-secondary/5 border border-secondary/20 px-5 py-4 mb-6 flex items-center justify-between gap-4 shadow-sm">
            <p className="text-sm font-medium text-text-strong">
              You have {events.length} {events.length === 1 ? 'entry' : 'entries'} from a previous
              session
            </p>
            <Button size="sm" onClick={onActivate}>
              <RotateCcw size={14} />
              Restore Session
            </Button>
          </div>
        )}

        <div id="landing-input" className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-surface border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex gap-1 p-1.5 bg-gray-100 border-b border-gray-200">
              <button
                onClick={() => setInputTab('text')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  inputTab === 'text'
                    ? 'bg-white text-secondary shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Type size={15} />
                Paste Text
              </button>
              <button
                onClick={() => setInputTab('file')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  inputTab === 'file'
                    ? 'bg-white text-secondary shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileUp size={15} />
                Upload CSV / JSON
              </button>
            </div>

            <div className="p-6 lg:p-8">
              {inputTab === 'text' ? (
                <InlineImportPanel noWrapper onDone={onActivate} />
              ) : (
                <FileImportContent onDone={onActivate} />
              )}
            </div>
          </div>

          {!hasEvents && (
            <p className="text-center text-xs text-text-muted mt-6">
              Works with partial dates and messy notes. No sign-up needed.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

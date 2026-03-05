import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  RotateCcw,
  Type,
  FileUp,
  ClipboardPaste,
  Share2,
  Zap,
  Eye,
  Filter,
  Download,
  Users,
  Calendar,
  ChevronRight,
  Play,
  Globe,
  Lock,
  Layers,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import Button from '@/components/shared/Button'
import InlineImportPanel from './InlineImportPanel'
import FileImportContent from './FileImportContent'

/* ─── Intersection Observer hook for scroll-reveal ─── */
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}

/* ─── Animated number counter ─── */
function Counter({ target, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

/* ─── Hero Timeline Animation ─── */
const HERO_EVENTS = [
  {
    date: '1989',
    title: 'Born in California',
    tag: 'family',
    color: '#2563eb',
    bg: '#dbeafe',
  },
  {
    date: '2010',
    title: 'Moved to Lima, Peru',
    tag: 'relocation',
    color: '#d97706',
    bg: '#fef3c7',
  },
  {
    date: '2016',
    title: 'Relocated to Shanghai',
    tag: 'relocation',
    color: '#059669',
    bg: '#d1fae5',
  },
  {
    date: '2021',
    title: 'New life in Bangkok',
    tag: 'relocation',
    color: '#0ea5e9',
    bg: '#e0f2fe',
  },
]

function HeroTimeline() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glow behind the timeline */}
      <div className="absolute inset-0 -m-8 bg-gradient-to-br from-secondary/5 via-transparent to-sky-400/5 rounded-3xl blur-2xl" />

      <div className="relative">
        {/* Vertical connector line */}
        <motion.div
          className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-secondary/40 via-sky-400/30 to-success/40 rounded-full origin-top"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />

        <div className="flex flex-col gap-1">
          {HERO_EVENTS.map((evt, i) => (
            <motion.div
              key={i}
              className="relative flex items-center gap-4 py-2.5 group"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.5 + i * 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Dot */}
              <motion.div
                className="relative z-10 flex items-center justify-center shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  duration: 0.5,
                  delay: 0.6 + i * 0.35,
                  bounce: 0.5,
                }}
              >
                <div
                  className="h-[14px] w-[14px] rounded-full ring-[3px] ring-white shadow-sm"
                  style={{ backgroundColor: evt.color }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${evt.color}` }}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    delay: 0.8 + i * 0.35,
                    ease: 'easeOut',
                  }}
                />
              </motion.div>

              {/* Card */}
              <motion.div
                className="landing-frosted rounded-xl border border-gray-200/60 px-4 py-2.5 flex-1 min-w-0 shadow-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.7 + i * 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: evt.color }}
                  >
                    {evt.date}
                  </span>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: evt.bg, color: evt.color }}
                  >
                    {evt.tag}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-strong leading-tight mt-0.5">
                  {evt.title}
                </p>
              </motion.div>

              {/* Year marker on far left for large screens */}
              <motion.span
                className="absolute -left-16 top-1/2 -translate-y-1/2 text-[11px] font-mono font-medium text-gray-400 hidden xl:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.9 + i * 0.35 }}
              >
                {evt.date}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Typewriter text for demo section ─── */
const DEMO_TEXT_LINES = [
  'I was born in California in 1989.',
  'Moved to Lima, Peru around 2010.',
  'Relocated to Shanghai in 2016 for work.',
  'Started a new chapter in Bangkok, 2021.',
]

function TypewriterDemo() {
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [ref, inView] = useInView()

  useEffect(() => {
    if (!inView) return
    if (lineIndex >= DEMO_TEXT_LINES.length) return
    const line = DEMO_TEXT_LINES[lineIndex]
    if (charIndex < line.length) {
      const timer = setTimeout(() => setCharIndex((c) => c + 1), 18)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setLineIndex((l) => l + 1)
        setCharIndex(0)
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [inView, lineIndex, charIndex])

  return (
    <div ref={ref} className="font-mono text-sm leading-relaxed text-text-default">
      {DEMO_TEXT_LINES.map((line, i) => {
        if (i > lineIndex) return null
        const text = i === lineIndex ? line.slice(0, charIndex) : line
        return (
          <div key={i} className="flex">
            <span className="text-gray-300 select-none w-6 shrink-0">{i + 1}</span>
            <span>
              {text}
              {i === lineIndex && lineIndex < DEMO_TEXT_LINES.length && (
                <span className="inline-block w-[2px] h-[1em] bg-secondary ml-[1px] align-text-bottom animate-[landing-blink_1s_infinite]" />
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Animated Step Card ─── */
function StepCard({ number, icon: Icon, title, description, delay = 0 }) {
  const [ref, inView] = useInView()
  return (
    <motion.div
      ref={ref}
      className="relative group"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="landing-card-hover rounded-2xl bg-white border border-gray-200/60 p-6 lg:p-8 h-full relative overflow-hidden">
        {/* Step number watermark */}
        <span className="absolute -top-4 -right-2 text-[80px] font-display font-bold text-gray-100/80 leading-none select-none">
          {number}
        </span>

        <div className="relative z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary/10 to-blue-400/10 flex items-center justify-center mb-5">
            <Icon size={20} className="text-secondary" />
          </div>
          <h3 className="font-display text-lg font-bold text-text-strong mb-2">{title}</h3>
          <p className="text-sm text-text-muted leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Feature row ─── */
function FeatureItem({ icon: Icon, title, description }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/10 to-blue-400/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={18} className="text-secondary" />
      </div>
      <div>
        <h4 className="font-display text-sm font-bold text-text-strong mb-1">{title}</h4>
        <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function LandingContent({ onActivate }) {
  const events = useTimelineStore((s) => s.events)
  const hasEvents = events.length > 0
  const [inputTab, setInputTab] = useState('text')
  const heroRef = useRef(null)

  // Scroll-based parallax for hero
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, 120])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  // Scroll-reveal refs
  const [problemRef, problemInView] = useInView()
  const [stepsRef, stepsInView] = useInView()
  const [demoRef, demoInView] = useInView()
  const [featuresRef, featuresInView] = useInView()
  const [ctaRef, ctaInView] = useInView()

  const scrollToInput = useCallback(() => {
    document.getElementById('landing-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <div className="flex flex-col items-center -mx-4 sm:-mx-6 -mt-6 overflow-hidden">
      {/* ════════════════════════════════════════════════════════
          HERO
         ════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative w-full overflow-hidden">
        {/* Background glow elements */}
        <div className="landing-hero-glow -top-48 -left-48 opacity-60" />
        <div className="landing-hero-glow -top-24 -right-48 opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.04),transparent_50%)]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-16 lg:pt-20 lg:pb-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              <motion.div
                className="inline-flex items-center gap-2 rounded-full bg-secondary/5 border border-secondary/15 px-3.5 py-1.5 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Sparkles size={14} className="text-secondary" />
                <span className="text-xs font-semibold text-secondary">AI-Powered</span>
              </motion.div>

              <motion.h1
                className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] text-text-strong"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                Paste your story.
                <br />
                <span className="landing-gradient-text">See it unfold.</span>
              </motion.h1>

              <motion.p
                className="text-lg text-text-muted leading-relaxed mt-5 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                Turn journal entries, research notes, or any text with dates into a beautiful,
                interactive timeline. AI extracts events, people, and connections automatically.
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <button
                  onClick={scrollToInput}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-text-strong text-white font-semibold text-sm shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/15 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  Try it free
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={scrollToInput}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-strong transition-colors cursor-pointer"
                >
                  <Play size={14} className="text-secondary" />
                  See how it works
                </button>
              </motion.div>

              <motion.div
                className="flex items-center gap-5 mt-8 text-xs text-text-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-gray-400" /> No sign-up
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe size={12} className="text-gray-400" /> Works offline
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap size={12} className="text-gray-400" /> Instant results
                </span>
              </motion.div>
            </div>

            {/* Right: Animated timeline demo */}
            <motion.div
              className="relative lg:pl-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroTimeline />
            </motion.div>
          </div>
        </motion.div>

        {/* Subtle divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </section>

      {/* ════════════════════════════════════════════════════════
          PROBLEM STATEMENT
         ════════════════════════════════════════════════════════ */}
      <section
        ref={problemRef}
        className={`landing-section ${problemInView ? 'visible' : ''} w-full py-12 lg:py-16`}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-4">
            The problem
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-strong leading-tight">
            Your memories are trapped in walls of text
          </h2>
          <p className="text-base text-text-muted leading-relaxed mt-4 max-w-2xl mx-auto">
            Journal entries, family histories, research notes — they all contain rich timelines buried
            in unstructured paragraphs. Extracting and organizing them manually takes hours.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS (3 Steps)
         ════════════════════════════════════════════════════════ */}
      <section
        ref={stepsRef}
        className={`landing-section ${stepsInView ? 'visible' : ''} w-full py-12 lg:py-16`}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-4">
              How it works
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-strong">
              Three steps. Seconds, not hours.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="1"
              icon={ClipboardPaste}
              title="Paste your text"
              description="Drop in any text — journal entries, biographies, research notes, family history. Messy formatting and partial dates are fine."
              delay={0}
            />
            <StepCard
              number="2"
              icon={Sparkles}
              title="AI extracts events"
              description="Our AI reads your text and identifies dates, events, people, and relationships. It handles approximate dates like 'summer 2019' or 'early 1990s'."
              delay={0.15}
            />
            <StepCard
              number="3"
              icon={Eye}
              title="Explore your timeline"
              description="View, edit, filter, and share your interactive timeline. Switch between vertical, horizontal, and grid views. Export anytime."
              delay={0.3}
            />
          </div>

          {/* Connector arrows between steps (desktop) */}
          <div className="hidden md:flex justify-around max-w-3xl mx-auto -mt-[210px] mb-[160px] pointer-events-none">
            <ChevronRight size={24} className="text-gray-300" />
            <ChevronRight size={24} className="text-gray-300" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          INTERACTIVE DEMO / CONVERSION
         ════════════════════════════════════════════════════════ */}
      <section
        ref={demoRef}
        className={`landing-section ${demoInView ? 'visible' : ''} w-full py-12 lg:py-16 bg-gradient-to-b from-gray-50/80 to-canvas`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-4">
              Try it now
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-strong">
              See the magic in action
            </h2>
            <p className="text-base text-text-muted mt-3 max-w-lg mx-auto">
              Paste any text with dates below. Or use our sample to see instant results.
            </p>
          </div>

          {/* Before / After visual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            {/* Before: raw text */}
            <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                </div>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider ml-2">
                  Your text
                </span>
              </div>
              <div className="p-5 min-h-[180px]">
                <TypewriterDemo />
              </div>
            </div>

            {/* After: extracted timeline */}
            <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                </div>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider ml-2">
                  Your timeline
                </span>
              </div>
              <div className="p-5 min-h-[180px]">
                <MiniTimeline />
              </div>
            </div>
          </div>

          {/* Session recovery */}
          {hasEvents && (
            <motion.div
              className="rounded-xl bg-secondary/5 border border-secondary/20 px-5 py-4 mb-8 flex items-center justify-between gap-4 shadow-sm max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-sm font-medium text-text-strong">
                You have {events.length} {events.length === 1 ? 'entry' : 'entries'} from a previous
                session
              </p>
              <Button size="sm" onClick={onActivate}>
                <RotateCcw size={14} />
                Restore Session
              </Button>
            </motion.div>
          )}

          {/* Input panel */}
          <div id="landing-input" className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-surface border border-gray-200 shadow-lg shadow-gray-900/[0.04] overflow-hidden">
              <div className="flex gap-1 p-1.5 bg-gray-100/80 border-b border-gray-200">
                <button
                  onClick={() => setInputTab('text')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    inputTab === 'text'
                      ? 'bg-white text-text-strong shadow-sm border border-gray-200'
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
                      ? 'bg-white text-text-strong shadow-sm border border-gray-200'
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
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURES
         ════════════════════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        className={`landing-section ${featuresInView ? 'visible' : ''} w-full py-14 lg:py-20`}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-4">
              Features
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-strong">
              Everything you need to tell a story
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 max-w-3xl mx-auto">
            <FeatureItem
              icon={Layers}
              title="Three view modes"
              description="Vertical, horizontal, and grid views — each designed for different ways of exploring your timeline."
            />
            <FeatureItem
              icon={Users}
              title="People & relationships"
              description="AI identifies people in your text and connects them to events, making it easy to filter by person."
            />
            <FeatureItem
              icon={Calendar}
              title="Smart date handling"
              description="Handles partial dates, approximate dates, decades, and date ranges — 'summer 2019' just works."
            />
            <FeatureItem
              icon={Filter}
              title="Search & filter"
              description="Full-text search, filter by people or tags, and review flagged dates that need attention."
            />
            <FeatureItem
              icon={Share2}
              title="Share with a link"
              description="Generate a shareable URL that anyone can view — no account needed. Data is compressed into the URL itself."
            />
            <FeatureItem
              icon={Download}
              title="Export anything"
              description="Export to CSV, JSON, Markdown, plain text, or print as PDF. Your data is always yours."
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SOCIAL PROOF / CREDIBILITY
         ════════════════════════════════════════════════════════ */}
      <section className="w-full py-10 lg:py-14 border-t border-gray-200/60">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-3xl font-bold text-text-strong">
                <Counter target={10} suffix="s" />
              </p>
              <p className="text-sm text-text-muted mt-1">to generate a timeline</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-text-strong">
                <Counter target={3} />
              </p>
              <p className="text-sm text-text-muted mt-1">view modes</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-text-strong">
                <Counter target={5} suffix="+" />
              </p>
              <p className="text-sm text-text-muted mt-1">export formats</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-text-strong">
                <Counter target={0} />
              </p>
              <p className="text-sm text-text-muted mt-1">sign-ups required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FINAL CTA
         ════════════════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        className={`landing-section ${ctaInView ? 'visible' : ''} w-full py-14 lg:py-20`}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-strong leading-tight">
            Your stories deserve
            <br />
            <span className="landing-gradient-text">a timeline</span>
          </h2>
          <p className="text-base text-text-muted mt-4 max-w-md mx-auto">
            No sign-up. No credit card. Paste your text and watch it come to life in seconds.
          </p>
          <div className="mt-8">
            <button
              onClick={scrollToInput}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-text-strong text-white font-semibold text-base shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/15 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              Get started — it&apos;s free
              <ArrowRight size={18} />
            </button>
          </div>
          {!hasEvents && (
            <p className="text-xs text-text-muted mt-6">
              Works with partial dates and messy notes. Export anytime.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

/* ─── Mini timeline for the "after" preview ─── */
function MiniTimeline() {
  const [ref, inView] = useInView()
  const events = [
    { year: '1989', title: 'Born in California', color: '#2563eb' },
    { year: '2010', title: 'Moved to Lima, Peru', color: '#d97706' },
    { year: '2016', title: 'Relocated to Shanghai', color: '#059669' },
    { year: '2021', title: 'New life in Bangkok', color: '#0ea5e9' },
  ]

  return (
    <div ref={ref} className="flex flex-col gap-2.5">
      {events.map((evt, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -15 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 4.5 + i * 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
            style={{ backgroundColor: evt.color }}
          />
          <span className="text-[10px] font-bold text-gray-400 tracking-wider w-8 shrink-0">
            {evt.year}
          </span>
          <span className="text-xs font-medium text-text-strong">{evt.title}</span>
        </motion.div>
      ))}
    </div>
  )
}

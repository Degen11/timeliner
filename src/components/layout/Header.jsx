import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react'
import Logo from './Logo'
import useTimelineStore from '@/store/useTimelineStore'

// Lightweight scroll listener — re-renders only on crossing the threshold
const SCROLL_THRESHOLD = 8
let _isScrolled = false
const _listeners = new Set()
if (typeof window !== 'undefined') {
  let ticking = false
  window.addEventListener('scroll', () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      const next = window.scrollY > SCROLL_THRESHOLD
      if (next !== _isScrolled) {
        _isScrolled = next
        _listeners.forEach((fn) => fn())
      }
      ticking = false
    })
  }, { passive: true })
}

function useIsScrolled() {
  return useSyncExternalStore(
    (cb) => { _listeners.add(cb); return () => _listeners.delete(cb) },
    () => _isScrolled,
    () => false,
  )
}

const STATUS_CONFIG = {
  idle: null,
  pending: { icon: Cloud, label: 'Saving\u2026', className: 'text-gray-400' },
  syncing: { icon: Loader2, label: 'Syncing\u2026', className: 'text-secondary animate-spin' },
  saved: { icon: Check, label: 'Saved', className: 'text-success' },
  error: { icon: CloudOff, label: 'Sync failed', className: 'text-error' },
}

export function SaveStatus() {
  const saveStatus = useTimelineStore((s) => s.saveStatus)
  const prevStatus = useRef(saveStatus)
  const [pulse, setPulse] = useState(false)
  const [visible, setVisible] = useState(saveStatus !== 'idle')

  useEffect(() => {
    const wasSyncing = prevStatus.current === 'syncing' || prevStatus.current === 'pending'
    prevStatus.current = saveStatus

    if (saveStatus === 'saved' && wasSyncing) {
      setPulse(true)
      setVisible(true)
      const pulseTimer = setTimeout(() => setPulse(false), 600)
      const fadeTimer = setTimeout(() => setVisible(false), 2500)
      return () => {
        clearTimeout(pulseTimer)
        clearTimeout(fadeTimer)
      }
    } else if (saveStatus !== 'idle' && saveStatus !== 'saved') {
      setVisible(true)
      setPulse(false)
    }
  }, [saveStatus])

  const config = STATUS_CONFIG[saveStatus]
  if (!config) return null

  const Icon = config.icon
  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] font-medium shrink-0 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      title={config.label}
    >
      <Icon
        size={12}
        className={`${config.className} ${pulse ? 'animate-[save-pulse_0.6s_ease-in-out]' : ''}`}
      />
      <span
        className={`text-gray-400 ${pulse ? 'text-success transition-colors duration-300' : 'transition-colors duration-300'}`}
      >
        {config.label}
      </span>
    </div>
  )
}

function Header({ toolbarContent, hideLogoOnDesktop = false }) {
  const isScrolled = useIsScrolled()

  return (
    <header
      className="border-b sticky top-0 z-30 header-surface transition-[backdrop-filter,box-shadow] duration-300"
      style={{
        backgroundColor: 'var(--color-header-bg)',
        borderColor: isScrolled ? 'var(--color-header-border)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
        boxShadow: isScrolled ? '0 1px 3px 0 rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <div className="flex h-14 items-center px-4 gap-3">
        <Link
          to="/"
          className={`no-underline text-text-strong rounded-lg shrink-0 ${hideLogoOnDesktop ? 'lg:hidden' : ''}`}
          aria-label="Home"
        >
          <Logo size="sm" />
        </Link>
        {!toolbarContent && (
          <span className="text-xs text-text-muted hidden sm:inline">
            Paste text. Get a timeline.
          </span>
        )}
        {toolbarContent && <div className="flex-1 min-w-0 flex items-center">{toolbarContent}</div>}
      </div>
    </header>
  )
}

export default Header

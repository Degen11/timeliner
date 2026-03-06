import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react'
import Logo from './Logo'
import useTimelineStore from '@/store/useTimelineStore'

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
      className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium shrink-0 transition-opacity duration-500 ${
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

export default function Header({ toolbarContent, hideLogoOnDesktop = false }) {
  return (
    <header
      className="border-b sticky top-0 z-30 header-surface"
      style={{
        backgroundColor: 'var(--color-header-bg)',
        borderColor: 'var(--color-header-border)',
        backdropFilter: 'blur(12px)',
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
        {toolbarContent && <div className="flex-1 min-w-0 flex items-center">{toolbarContent}</div>}
      </div>
    </header>
  )
}

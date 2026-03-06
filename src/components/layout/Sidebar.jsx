import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  AlertTriangle,
  Waypoints,
  ArrowUpDown,
  Image,
  ChevronsLeft,
  ChevronsRight,
  X,
  Download,
  HelpCircle,
  Globe,
  Github,
  Moon,
  Sun,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFlaggedEvents } from '@/store/selectors'
import ExportModal from './ExportModal'
import SidebarContent from './SidebarContent'
import Logo, { LogoIcon } from './Logo'

function SidebarLogo({ iconOnly = false }) {
  if (iconOnly) {
    return (
      <Link to="/" className="no-underline" aria-label="Home">
        <LogoIcon size={20} className="text-sidebar-text" />
      </Link>
    )
  }
  return (
    <Link to="/" className="no-underline inline-flex" aria-label="Home">
      <Logo size="sm" textClassName="text-sidebar-text" />
    </Link>
  )
}

function SidebarFooter({ collapsed = false }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-3 border-t border-sidebar-input-border">
        <a
          href="https://www.degenh.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website"
          className="text-sidebar-muted hover:text-sidebar-text transition-colors p-1"
        >
          <Globe size={13} />
        </a>
        <a
          href="https://github.com/Degen11"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-sidebar-muted hover:text-sidebar-text transition-colors p-1"
        >
          <Github size={13} />
        </a>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-t border-sidebar-input-border">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-sidebar-muted">Built by Degen Hill</span>
        <div className="flex items-center gap-2">
          <a
            href="https://www.degenh.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
            className="text-sidebar-muted hover:text-sidebar-text transition-colors"
          >
            <Globe size={13} />
          </a>
          <a
            href="https://github.com/Degen11"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-sidebar-muted hover:text-sidebar-text transition-colors"
          >
            <Github size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}

function IconButton({ icon, label, onClick, badge, variant, dark = false }) {
  const isFlagged = variant === 'flag'
  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg p-2.5 transition-colors cursor-pointer ${
        isFlagged
          ? 'text-flag hover:bg-flag/10 active:bg-flag/20'
          : dark
            ? 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover active:bg-sidebar-active'
            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200'
      }`}
      title={label}
    >
      {icon}
      {badge != null && (
        <span
          className={`absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[11px] font-bold px-0.5 ${
            isFlagged ? 'bg-flag text-white' : 'bg-secondary text-white'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

function DarkModeToggleIcon() {
  const darkMode = useTimelineStore((s) => s.darkMode)
  const toggleDarkMode = useTimelineStore((s) => s.toggleDarkMode)
  return (
    <IconButton
      icon={darkMode ? <Sun size={18} /> : <Moon size={18} />}
      label={darkMode ? 'Light mode' : 'Dark mode'}
      onClick={toggleDarkMode}
      dark
    />
  )
}

export default function Sidebar({ photoCount, onPhotoLibOpen, onShowShortcuts }) {
  const collapsed = useTimelineStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useTimelineStore((s) => s.toggleSidebar)
  const filters = useTimelineStore((s) => s.filters)
  const events = useTimelineStore((s) => s.events)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)

  const flaggedCount = useMemo(() => getFlaggedEvents(events).length, [events])
  const activeFilterCount = (filters.search ? 1 : 0) + filters.people.length + filters.tags.length

  const [exportModalOpen, setExportModalOpen] = useState(false)

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 bg-sidebar-bg sticky top-0 h-screen z-40 transition-[width] duration-200 ease-in-out overflow-hidden border-r border-sidebar-border ${
        collapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      {collapsed ? (
        <div className="shrink-0 flex flex-col items-center gap-2 py-3.5 border-b border-sidebar-border">
          <SidebarLogo iconOnly />
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-all cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-3.5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <SidebarLogo />
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-1 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-all cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronsLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {collapsed ? (
        <div className="flex flex-col items-center gap-0.5 py-2 flex-1">
          <IconButton
            icon={<Waypoints size={18} />}
            label="Timelines"
            onClick={toggleSidebar}
            dark
          />
          <IconButton icon={<ArrowUpDown size={18} />} label="Sort" onClick={toggleSidebar} dark />

          <div className="w-6 h-px bg-sidebar-border my-1.5" />
          <IconButton icon={<Search size={18} />} label="Search" onClick={toggleSidebar} dark />
          <IconButton
            icon={<SlidersHorizontal size={18} />}
            label="Filters"
            onClick={toggleSidebar}
            badge={activeFilterCount || null}
            dark
          />
          {flaggedCount > 0 && (
            <IconButton
              icon={<AlertTriangle size={18} />}
              label="Flagged review"
              onClick={toggleReviewMode}
              badge={flaggedCount}
              variant="flag"
              dark
            />
          )}

          <div className="w-6 h-px bg-sidebar-border my-1.5" />
          <IconButton
            icon={<Image size={18} />}
            label="Photos"
            onClick={onPhotoLibOpen}
            badge={photoCount > 0 ? photoCount : null}
            dark
          />
          <IconButton
            icon={<Download size={18} />}
            label="Export / Share"
            onClick={() => setExportModalOpen(true)}
            dark
          />

          <div className="flex-1" />
          <div className="w-6 h-px bg-sidebar-border my-1" />
          <DarkModeToggleIcon />
          <IconButton icon={<HelpCircle size={18} />} label="Help" onClick={onShowShortcuts} dark />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden px-3 py-3">
          <SidebarContent
            photoCount={photoCount}
            onPhotoLibOpen={onPhotoLibOpen}
            onShowShortcuts={onShowShortcuts}
            onExportOpen={() => setExportModalOpen(true)}
            dark
          />
        </div>
      )}

      <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />

      <SidebarFooter collapsed={collapsed} />
    </aside>
  )
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.4 },
}

const drawerVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0 },
  exit: { x: '-100%' },
}

export function SidebarDrawer({ open, onClose, photoCount, onPhotoLibOpen, onShowShortcuts }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-black lg:hidden"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 left-0 z-40 w-full max-w-xs bg-sidebar-bg shadow-2xl flex flex-col lg:hidden touch-pan-y"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            drag="x"
            dragConstraints={{ left: -320, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -80 || info.velocity.x < -300) onClose()
            }}
          >
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3.5 shrink-0">
              <SidebarLogo />
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
              <SidebarContent
                photoCount={photoCount}
                onPhotoLibOpen={onPhotoLibOpen}
                onShowShortcuts={onShowShortcuts}
                onExportOpen={() => setExportModalOpen(true)}
                dark
              />
            </div>
            <SidebarFooter />
            <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

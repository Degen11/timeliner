import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Drawer } from 'vaul'
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
  Moon,
  Sun,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { Tooltip } from '@/components/ui/Tooltip'
// Lazy so the heavy export chunk (jsPDF/PapaParse/file-saver) stays off the
// critical path — it loads only when the export modal is first opened.
const ExportModal = lazy(() => import('./ExportModal'))
import SidebarContent from './SidebarContent'
import Logo, { LogoIcon } from './Logo'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { EASE_OUT, SPRING } from '@/utils/constants'

function SidebarLogo({ iconOnly = false }) {
  if (iconOnly) {
    return (
      <Link to="/" className="no-underline" aria-label="Home">
        <LogoIcon size={22} className="text-text-strong" />
      </Link>
    )
  }
  return (
    <Link to="/" className="no-underline inline-flex" aria-label="Home">
      <Logo size="sm" textClassName="text-text-strong" />
    </Link>
  )
}

const footerLinkClass =
  'text-text-muted hover:text-text-strong dark:text-sidebar-muted dark:hover:text-sidebar-text transition-colors duration-150'

function SidebarFooter({ collapsed = false }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-3 border-t border-gray-200 dark:border-sidebar-input-border">
        <a
          href="https://www.degenh.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website"
          className={`${footerLinkClass} p-1`}
        >
          <Globe size={14} />
        </a>
        <a
          href="https://github.com/Degen11"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className={`${footerLinkClass} p-1`}
        >
          <SiGithub size={14} />
        </a>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 border-t border-gray-200 dark:border-sidebar-input-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted dark:text-sidebar-muted">Built by Degen Hill</span>
        <div className="flex items-center gap-2">
          <a
            href="https://www.degenh.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
            className={footerLinkClass}
          >
            <Globe size={14} />
          </a>
          <a
            href="https://github.com/Degen11"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className={footerLinkClass}
          >
            <SiGithub size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}

function IconButton({ icon, label, onClick, badge, variant, dark = false }) {
  const isFlagged = variant === 'flag'
  return (
    <Tooltip label={label} position="right">
      <button
        onClick={onClick}
        aria-label={typeof label === 'string' ? label : undefined}
        className={`relative rounded-lg p-2 transition-colors duration-150 cursor-pointer ${
          isFlagged
            ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 active:bg-amber-500/20'
            : dark
              ? 'text-text-muted hover:text-text-default hover:bg-surface-raised active:bg-gray-200 dark:text-sidebar-muted dark:hover:text-sidebar-text dark:hover:bg-sidebar-hover dark:active:bg-sidebar-active'
              : 'text-text-muted hover:text-text-default hover:bg-surface-raised active:bg-gray-200'
        }`}
      >
        {icon}
        {badge != null && (
          <span
            className={`absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-xs font-bold px-0.5 ${
              isFlagged ? 'bg-amber-500 text-white' : 'bg-secondary text-white'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    </Tooltip>
  )
}

function DarkModeToggleIcon() {
  const darkMode = useTimelineStore((s) => s.darkMode)
  const toggleDarkMode = useTimelineStore((s) => s.toggleDarkMode)
  return (
    <IconButton
      icon={
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={darkMode ? 'sun' : 'moon'}
            initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
            transition={SPRING.SNAPPY}
            className="inline-flex"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </motion.span>
        </AnimatePresence>
      }
      label={darkMode ? 'Light mode' : 'Dark mode'}
      onClick={toggleDarkMode}
      dark
    />
  )
}

const sidebarToggleBtnClass =
  'rounded-lg p-1 text-text-muted hover:text-text-default hover:bg-surface-raised dark:text-sidebar-muted dark:hover:text-sidebar-text dark:hover:bg-sidebar-hover transition-colors duration-150 cursor-pointer'

export default function Sidebar({ photoCount, onPhotoLibOpen, onShowShortcuts }) {
  const collapsed = useTimelineStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useTimelineStore((s) => s.toggleSidebar)
  const darkMode = useTimelineStore((s) => s.darkMode)
  const filters = useTimelineStore((s) => s.filters)
  const flaggedCount = useTimelineStore((s) => s.events.filter((e) => e.flagged).length)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)

  const activeFilterCount = (filters.search ? 1 : 0) + filters.people.length + filters.tags.length

  const [exportModalOpen, setExportModalOpen] = useState(false)

  return (
    <motion.aside
      className="hidden lg:flex flex-col shrink-0 bg-surface dark:bg-sidebar-bg sticky top-0 h-screen z-40 overflow-hidden border-r border-gray-200 dark:border-sidebar-border"
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.div
            key="collapsed-header"
            className="shrink-0 flex flex-col items-center gap-2 py-3.5 border-b border-gray-200 dark:border-sidebar-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SidebarLogo iconOnly />
            <Tooltip label="Expand sidebar" position="right">
              <button
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                aria-expanded={false}
                className={sidebarToggleBtnClass}
              >
                <ChevronsRight size={14} />
              </button>
            </Tooltip>
          </motion.div>
        ) : (
          <motion.div
            key="expanded-header"
            className="shrink-0 px-3 py-3.5 border-b border-gray-200 dark:border-sidebar-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between">
              <SidebarLogo />
              <Tooltip label="Collapse sidebar">
                <button
                  onClick={toggleSidebar}
                  aria-label="Collapse sidebar"
                  aria-expanded={true}
                  className={sidebarToggleBtnClass}
                >
                  <ChevronsLeft size={14} />
                </button>
              </Tooltip>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
      {collapsed ? (
        <motion.div
          key="collapsed-body"
          className="flex flex-col items-center gap-0.5 py-2 flex-1 sidebar-scroll overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <IconButton
            icon={<Waypoints size={16} />}
            label="Timelines"
            onClick={toggleSidebar}
            dark
          />
          <IconButton icon={<ArrowUpDown size={16} />} label="Sort" onClick={toggleSidebar} dark />

          <div className="w-6 h-px bg-gray-200 dark:bg-sidebar-border my-1.5" />
          <IconButton icon={<Search size={16} />} label="Search" onClick={toggleSidebar} dark />
          <IconButton
            icon={<SlidersHorizontal size={16} />}
            label="Filters"
            onClick={toggleSidebar}
            badge={activeFilterCount || null}
            dark
          />
          {flaggedCount > 0 && (
            <IconButton
              icon={<AlertTriangle size={16} />}
              label="Flagged review"
              onClick={toggleReviewMode}
              badge={flaggedCount}
              variant="flag"
              dark
            />
          )}

          <div className="w-6 h-px bg-gray-200 dark:bg-sidebar-border my-1.5" />
          <IconButton
            icon={<Image size={16} />}
            label="Photos"
            onClick={onPhotoLibOpen}
            badge={photoCount > 0 ? photoCount : null}
            dark
          />
          <IconButton
            icon={<Download size={16} />}
            label="Export / Share"
            onClick={() => setExportModalOpen(true)}
            dark
          />

          <div className="flex-1" />
          <div className="w-6 h-px bg-gray-200 dark:bg-sidebar-border my-1" />
          <DarkModeToggleIcon />
          <IconButton icon={<HelpCircle size={16} />} label="Help" onClick={onShowShortcuts} dark />
        </motion.div>
      ) : (
        <motion.div
          key="expanded-body"
          className="flex-1 overflow-hidden px-3 py-3 sidebar-scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <SidebarContent
            photoCount={photoCount}
            onPhotoLibOpen={onPhotoLibOpen}
            onShowShortcuts={onShowShortcuts}
            onExportOpen={() => setExportModalOpen(true)}
            dark={darkMode}
          />
        </motion.div>
      )}
      </AnimatePresence>

      {exportModalOpen && (
        <Suspense fallback={null}>
          <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
        </Suspense>
      )}

      <SidebarFooter collapsed={collapsed} />
    </motion.aside>
  )
}

export function SidebarDrawer({ open, onClose, photoCount, onPhotoLibOpen, onShowShortcuts }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const darkMode = useTimelineStore((s) => s.darkMode)

  return (
    <Drawer.Root direction="left" open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-30 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="fixed inset-y-0 left-0 z-40 w-full max-w-xs bg-surface dark:bg-sidebar-bg shadow-2xl flex flex-col lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-sidebar-border px-3 py-3.5 shrink-0">
            <SidebarLogo />
            <button
              onClick={onClose}
              className="rounded-lg p-2.5 text-text-muted hover:text-text-default hover:bg-surface-raised active:bg-gray-200 dark:text-sidebar-muted dark:hover:text-sidebar-text dark:hover:bg-sidebar-hover dark:active:bg-sidebar-active transition-colors duration-150 cursor-pointer touch-target"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sidebar-scroll">
            <SidebarContent
              photoCount={photoCount}
              onPhotoLibOpen={onPhotoLibOpen}
              onShowShortcuts={onShowShortcuts}
              onExportOpen={() => setExportModalOpen(true)}
              dark={darkMode}
            />
          </div>
          <SidebarFooter />
          {exportModalOpen && (
            <Suspense fallback={null}>
              <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
            </Suspense>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

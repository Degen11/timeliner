import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Drawer } from 'vaul'
import { Link } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  Flag,
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
  Shield,
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

function SidebarFooter({ collapsed = false, onShowShortcuts }) {
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
        <Link to="/privacy" aria-label="Privacy Policy" className={`${footerLinkClass} p-1`}>
          <Shield size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-2 border-t border-gray-200 dark:border-sidebar-border">
      <DarkModeToggleIcon />
      <IconButton icon={<HelpCircle size={16} />} label="Help & shortcuts" onClick={onShowShortcuts} dark />
      <span className="flex-1" />
      <Link
        to="/privacy"
        className={`${footerLinkClass} px-1.5 text-xs underline-offset-2 hover:underline`}
      >
        Privacy
      </Link>
      <Tooltip label="Built by Degen Hill">
        <a
          href="https://www.degenh.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Degen Hill's website"
          className={`${footerLinkClass} p-1.5`}
        >
          <Globe size={14} />
        </a>
      </Tooltip>
      <a
        href="https://github.com/Degen11"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className={`${footerLinkClass} p-1.5`}
      >
        <SiGithub size={14} />
      </a>
    </div>
  )
}

const actionBtnClass =
  'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-text-default hover:bg-surface-raised active:bg-gray-200 dark:text-sidebar-text dark:hover:bg-sidebar-hover dark:active:bg-sidebar-active transition-colors duration-150 cursor-pointer'

function SidebarActions({ photoCount, onPhotoLibOpen, onExportOpen }) {
  return (
    <div className="px-2 py-1.5 space-y-0.5 border-t border-gray-100 dark:border-sidebar-border">
      <button type="button" onClick={onPhotoLibOpen} className={actionBtnClass}>
        <Image size={15} className="text-text-muted dark:text-sidebar-muted" aria-hidden="true" />
        <span>Photo library</span>
        {photoCount > 0 && (
          <span className="ml-auto text-xs tabular-nums text-text-muted dark:text-sidebar-muted">
            {photoCount}
          </span>
        )}
      </button>
      <button type="button" onClick={onExportOpen} className={actionBtnClass}>
        <Download size={15} className="text-text-muted dark:text-sidebar-muted" aria-hidden="true" />
        <span>Export &amp; share</span>
      </button>
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
            ? 'text-flag hover:bg-flag/10 active:bg-flag/20'
            : dark
              ? 'text-text-muted hover:text-text-default hover:bg-surface-raised active:bg-gray-200 dark:text-sidebar-muted dark:hover:text-sidebar-text dark:hover:bg-sidebar-hover dark:active:bg-sidebar-active'
              : 'text-text-muted hover:text-text-default hover:bg-surface-raised active:bg-gray-200'
        }`}
      >
        {icon}
        {badge != null && (
          <span
            className={`absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-xs font-bold px-0.5 ${
              isFlagged ? 'bg-flag text-white' : 'bg-secondary text-white'
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
  const filters = useTimelineStore((s) => s.filters)
  const flaggedCount = useTimelineStore((s) => s.events.filter((e) => e.flagged).length)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.people.length +
    filters.tags.length +
    (filters.dateFrom || filters.dateTo ? 1 : 0)

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
          className="flex flex-col items-center gap-0.5 py-2 flex-1 overflow-hidden"
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
              icon={<Flag size={16} />}
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
          className="flex-1 min-h-0 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex-1 min-h-0 overflow-hidden px-4 py-3">
            <SidebarContent />
          </div>
          <SidebarActions
            photoCount={photoCount}
            onPhotoLibOpen={onPhotoLibOpen}
            onExportOpen={() => setExportModalOpen(true)}
          />
        </motion.div>
      )}
      </AnimatePresence>

      {exportModalOpen && (
        <Suspense fallback={null}>
          <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
        </Suspense>
      )}

      <SidebarFooter collapsed={collapsed} onShowShortcuts={onShowShortcuts} />
    </motion.aside>
  )
}

export function SidebarDrawer({ open, onClose, photoCount, onPhotoLibOpen, onShowShortcuts }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

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
          <div className="flex-1 min-h-0 overflow-hidden px-4 py-3">
            <SidebarContent />
          </div>
          <SidebarActions
            photoCount={photoCount}
            onPhotoLibOpen={onPhotoLibOpen}
            onExportOpen={() => setExportModalOpen(true)}
          />
          <SidebarFooter onShowShortcuts={onShowShortcuts} />
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

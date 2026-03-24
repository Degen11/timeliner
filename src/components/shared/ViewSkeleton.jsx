import { motion } from 'framer-motion'
import { VIEWS, MOTION_DURATION, EASE_OUT } from '@/utils/constants'

function CardSkeleton({ wide = false }) {
  return (
    <div className="rounded-xl bg-surface border border-gray-200/60 p-5 space-y-3">
      <div className="skeleton h-3 w-20 rounded" />
      <div className={`skeleton h-4 rounded ${wide ? 'w-64' : 'w-52'}`} />
      <div className="skeleton h-3 rounded" style={{ maxWidth: '80%' }} />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

function VerticalSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <div className="skeleton h-5 w-16 rounded" />
      <CardSkeleton />
      <CardSkeleton wide />
      <div className="skeleton h-5 w-16 rounded" />
      <CardSkeleton />
    </div>
  )
}

function HorizontalSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden py-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="shrink-0 w-64 rounded-xl bg-surface border border-gray-200/60 p-4 space-y-3">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-xl bg-surface border border-gray-200/60 p-4 space-y-3">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-full rounded" style={{ maxWidth: '75%' }} />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="rounded-xl bg-surface border border-gray-200/60 overflow-hidden">
      <div className="skeleton h-[400px] w-full rounded-none" />
    </div>
  )
}

function GraphSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative w-64 h-64">
        {/* Nodes */}
        {[
          { top: '10%', left: '50%' },
          { top: '45%', left: '15%' },
          { top: '45%', left: '85%' },
          { top: '80%', left: '35%' },
          { top: '80%', left: '65%' },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute skeleton w-10 h-10 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ top: pos.top, left: pos.left }}
          />
        ))}
      </div>
    </div>
  )
}

const SKELETON_MAP = {
  [VIEWS.VERTICAL]: VerticalSkeleton,
  [VIEWS.HORIZONTAL]: HorizontalSkeleton,
  [VIEWS.GRID]: GridSkeleton,
  [VIEWS.MAP]: MapSkeleton,
  [VIEWS.GRAPH]: GraphSkeleton,
}

export default function ViewSkeleton({ view }) {
  const Component = SKELETON_MAP[view] || VerticalSkeleton
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION_DURATION.FAST, ease: EASE_OUT }}
    >
      <Component />
    </motion.div>
  )
}

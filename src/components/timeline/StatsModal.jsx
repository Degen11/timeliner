

import { X, Calendar, Users, MapPin, Tag, Image, Hash, TrendingUp } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { Button } from '@/components/ui/Button'
import { safeGetUTCYear } from '@/utils/dateUtils'
import { getAllPeople, getAllTags } from '@/store/selectors'
import Badge from '@/components/shared/Badge'

function StatCard({ icon: Icon, label, value, color = 'bg-secondary/10 text-secondary' }) {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-surface p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-text-strong tabular-nums leading-tight">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  )
}

function computeStats(events) {
  if (events.length === 0) return null

  const allPeople = getAllPeople(events)
  const allTags = getAllTags(events)
  const locationCount = events.filter((e) => e.location).length

  const years = events
    .map((e) => safeGetUTCYear(e.dateStart))
    .filter((y) => typeof y === 'number')
  const minYear = years.length > 0 ? Math.min(...years) : null
  const maxYear = years.length > 0 ? Math.max(...years) : null
  const span =
    minYear != null && maxYear != null && minYear !== maxYear
      ? `${minYear}\u2013${maxYear}`
      : minYear != null
        ? `${minYear}`
        : null
  const yearSpanCount =
    minYear != null && maxYear != null ? maxYear - minYear + 1 : null

  const peopleCounts = {}
  for (const e of events) {
    for (const p of e.people || []) {
      peopleCounts[p] = (peopleCounts[p] || 0) + 1
    }
  }
  const topPeople = Object.entries(peopleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const tagCounts = {}
  for (const e of events) {
    for (const t of e.tags || []) {
      tagCounts[t] = (tagCounts[t] || 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return { allPeople, allTags, locationCount, span, yearSpanCount, topPeople, topTags }
}

export default function StatsModal({ open, onClose, events, photoCount }) {
  // Only compute stats while the modal is open — avoids O(n) work on every
  // event mutation when the modal is closed.
  const stats = open ? computeStats(events) : null

  return (
    <AnimatedModal
      open={open && !!stats}
      onClose={onClose}
      className="bg-surface rounded-xl shadow-2xl max-w-xl w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-secondary" />
          </div>
          <h3 className="text-base font-semibold text-text-strong">Timeline Stats</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      {stats && (
        <div className="px-5 py-4 overflow-y-auto app-scroll flex-1 min-h-0 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Hash} label="Events" value={events.length} color="bg-secondary/10 text-secondary" />
            {stats.span && (
              <StatCard
                icon={Calendar}
                label="Date span"
                value={
                  stats.yearSpanCount && stats.yearSpanCount > 1
                    ? `${stats.yearSpanCount} yrs`
                    : stats.span
                }
                color="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
              />
            )}
            <StatCard icon={Users} label="People" value={stats.allPeople.length} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" />
            <StatCard icon={Tag} label="Tags" value={stats.allTags.length} color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" />
            <StatCard icon={MapPin} label="Locations" value={stats.locationCount} color="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" />
            <StatCard icon={Image} label="Photos" value={photoCount} color="bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400" />
          </div>

          {stats.span && (
            <div className="text-center text-xs text-text-muted">
              Spanning <span className="font-semibold text-text-default">{stats.span}</span>
            </div>
          )}

          {stats.topPeople.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                Top People
              </p>
              <div className="space-y-1.5">
                {stats.topPeople.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-surface-raised/50">
                    <Badge variant="accent" small>{name}</Badge>
                    <span className="text-xs text-text-muted tabular-nums">
                      {count} event{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.topTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                Top Tags
              </p>
              <div className="space-y-1.5">
                {stats.topTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-surface-raised/50">
                    <Badge variant={tag} small>{tag}</Badge>
                    <span className="text-xs text-text-muted tabular-nums">
                      {count} event{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatedModal>
  )
}

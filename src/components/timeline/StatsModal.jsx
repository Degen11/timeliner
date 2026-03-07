import { useMemo } from 'react'
import { X, Calendar, Users, MapPin, Tag, Image, Hash } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { safeGetUTCYear } from '@/utils/dateUtils'
import { getAllPeople, getAllTags } from '@/store/selectors'
import Badge from '@/components/shared/Badge'

function StatRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-sm text-gray-600">
        <Icon size={14} className="text-gray-400" />
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
    </div>
  )
}

export default function StatsModal({ open, onClose, events, photoCount }) {
  const stats = useMemo(() => {
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

    // Top people by event count
    const peopleCounts = {}
    for (const e of events) {
      for (const p of e.people || []) {
        peopleCounts[p] = (peopleCounts[p] || 0) + 1
      }
    }
    const topPeople = Object.entries(peopleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Top tags by event count
    const tagCounts = {}
    for (const e of events) {
      for (const t of e.tags || []) {
        tagCounts[t] = (tagCounts[t] || 0) + 1
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      allPeople,
      allTags,
      locationCount,
      span,
      yearSpanCount,
      topPeople,
      topTags,
    }
  }, [events])

  if (!stats) return null

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="font-display text-lg font-semibold text-gray-900">Timeline Stats</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
        <div className="divide-y divide-gray-100">
          <StatRow icon={Hash} label="Events" value={events.length} />
          {stats.span && (
            <StatRow
              icon={Calendar}
              label="Date span"
              value={
                stats.yearSpanCount && stats.yearSpanCount > 1
                  ? `${stats.span} (${stats.yearSpanCount} yrs)`
                  : stats.span
              }
            />
          )}
          <StatRow icon={Users} label="People" value={stats.allPeople.length} />
          <StatRow icon={Tag} label="Tags" value={stats.allTags.length} />
          <StatRow icon={MapPin} label="Locations" value={stats.locationCount} />
          <StatRow icon={Image} label="Photos" value={photoCount} />
        </div>

        {stats.topPeople.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              Top People
            </p>
            <div className="space-y-1.5">
              {stats.topPeople.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between gap-2">
                  <Badge variant="accent" small>{name}</Badge>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {count} event{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topTags.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              Top Tags
            </p>
            <div className="space-y-1.5">
              {stats.topTags.map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between gap-2">
                  <Badge variant={tag} small>{tag}</Badge>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {count} event{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatedModal>
  )
}

import { useState } from 'react'
import { Waypoints, Plus, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import useConfirmAction from '@/hooks/useConfirmAction'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover'
import { Separator } from '@/components/ui/Separator'
import { Tooltip } from '@/components/ui/Tooltip'

export default function TimelineManager({ dark = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [newName, setNewName] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const timelines = useTimelineStore((s) => s.timelines)
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId)
  const events = useTimelineStore((s) => s.events)
  const saveCurrentAsTimeline = useTimelineStore((s) => s.saveCurrentAsTimeline)
  const loadTimeline = useTimelineStore((s) => s.loadTimeline)
  const deleteTimeline = useTimelineStore((s) => s.deleteTimeline)
  const createNewTimeline = useTimelineStore((s) => s.createNewTimeline)
  const updateTimelineName = useTimelineStore((s) => s.updateTimelineName)
  const showToast = useTimelineStore((s) => s.showToast)

  const deleteConfirm = useConfirmAction(() => {
    if (pendingDeleteId) {
      deleteTimeline(pendingDeleteId)
      setPendingDeleteId(null)
      showToast('Timeline deleted')
    }
  })

  const handleSaveCurrent = () => {
    const name = `Timeline ${timelines.length + 1}`
    saveCurrentAsTimeline(name)
    showToast('Timeline saved')
  }

  const handleCreateNew = () => {
    if (!newName.trim()) return
    createNewTimeline(newName.trim())
    setNewName('')
    setShowNewInput(false)
    showToast('New timeline created')
  }

  const handleRename = (id) => {
    if (!renameDraft.trim()) return
    updateTimelineName(id, renameDraft.trim())
    setRenaming(null)
  }

  const handleDelete = (id) => {
    if (deleteConfirm.isArmed && pendingDeleteId === id) {
      deleteConfirm.confirm()
    } else {
      setPendingDeleteId(id)
      deleteConfirm.arm()
    }
  }

  const handleOpenChange = (open) => {
    setIsOpen(open)
    if (!open) {
      setShowNewInput(false)
      setRenaming(null)
      deleteConfirm.reset()
      setPendingDeleteId(null)
    }
  }

  const activeName = timelines.find((t) => t.id === activeTimelineId)?.name

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-150 cursor-pointer ${
            dark
              ? 'border-sidebar-input-border bg-sidebar-input text-sidebar-text hover:bg-sidebar-hover'
              : 'border-gray-200 bg-white text-text-default hover:bg-surface-raised'
          }`}
          aria-label="Manage timelines"
        >
          <Waypoints size={14} className="shrink-0" />
          <span className="flex-1 text-left line-clamp-2 break-words">{activeName || 'Projects'}</span>
          <ChevronDown
            size={12}
            className={`shrink-0 ${dark ? 'text-sidebar-muted' : 'text-text-muted'}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={`min-w-[240px] p-0 ${
          dark ? 'border-sidebar-input-border bg-sidebar-surface' : ''
        }`}
      >
        <div className={`p-2 border-b ${dark ? 'border-sidebar-border' : 'border-gray-200'}`}>
          <div
            className={`text-xs font-medium uppercase tracking-wider px-2 py-1 ${
              dark ? 'text-sidebar-heading' : 'text-text-muted'
            }`}
          >
            Timelines
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto app-scroll py-1">
          {timelines.length === 0 && (
            <p className={`px-3 py-2 text-xs ${dark ? 'text-sidebar-muted' : 'text-text-muted'}`}>
              No saved timelines yet
            </p>
          )}

          {timelines.map((tl) => (
            <div
              key={tl.id}
              className={`flex items-center gap-2 px-2 py-1.5 mx-1 rounded-lg group ${
                tl.id === activeTimelineId
                  ? dark
                    ? 'bg-sidebar-active'
                    : 'bg-soft-accent'
                  : dark
                    ? 'hover:bg-sidebar-hover'
                    : 'hover:bg-surface-raised'
              }`}
            >
              {renaming === tl.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(tl.id)
                      if (e.key === 'Escape') setRenaming(null)
                    }}
                    className={`flex-1 text-base sm:text-sm border rounded-lg px-2 py-0.5 focus:outline-none focus:border-secondary transition-colors ${
                      dark
                        ? 'border-sidebar-input-border bg-sidebar-input text-sidebar-text'
                        : 'border-gray-200 bg-canvas'
                    }`}
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(tl.id)}
                    className="p-1 text-success cursor-pointer"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setRenaming(null)}
                    className={`p-1 cursor-pointer ${dark ? 'text-sidebar-muted' : 'text-text-muted'}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      loadTimeline(tl.id)
                      setIsOpen(false)
                    }}
                    className={`flex-1 text-left text-sm truncate cursor-pointer ${dark ? 'text-sidebar-text' : 'text-text-default'}`}
                  >
                    {tl.name}
                    <span
                      className={`text-xs ml-1.5 ${dark ? 'text-sidebar-muted' : 'text-text-muted'}`}
                    >
                      ({tl.events.length} event{tl.events.length !== 1 ? 's' : ''})
                    </span>
                  </button>
                  <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                    <Tooltip label="Rename">
                      <button
                        onClick={() => {
                          setRenaming(tl.id)
                          setRenameDraft(tl.name)
                        }}
                        className={`p-1 cursor-pointer transition-colors duration-150 ${dark ? 'text-sidebar-muted hover:text-sidebar-text' : 'text-text-muted hover:text-text-default'}`}
                        aria-label={`Rename ${tl.name}`}
                      >
                        <Pencil size={12} />
                      </button>
                    </Tooltip>
                    <Tooltip label={deleteConfirm.isArmed && pendingDeleteId === tl.id ? 'Click again to confirm' : 'Delete'}>
                      <button
                        onClick={() => handleDelete(tl.id)}
                        className={`p-1 cursor-pointer transition-colors duration-150 ${deleteConfirm.isArmed && pendingDeleteId === tl.id ? 'text-error' : dark ? 'text-sidebar-muted hover:text-error' : 'text-text-muted hover:text-error'}`}
                        aria-label={deleteConfirm.isArmed && pendingDeleteId === tl.id ? `Click again to confirm deleting ${tl.name}` : `Delete ${tl.name}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </Tooltip>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <Separator className={dark ? 'bg-sidebar-border' : ''} />

        <div className="p-2 space-y-1">
          {events.length > 0 && !activeTimelineId && (
            <button
              onClick={handleSaveCurrent}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors duration-150 cursor-pointer ${
                dark
                  ? 'text-sidebar-text hover:bg-sidebar-hover'
                  : 'text-text-default hover:bg-surface-raised'
              }`}
            >
              <Waypoints size={14} className={dark ? 'text-sidebar-muted' : 'text-text-muted'} />
              Save current as project
            </button>
          )}

          {showNewInput ? (
            <div className="flex items-center gap-1 px-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNew()
                  if (e.key === 'Escape') setShowNewInput(false)
                }}
                placeholder="Timeline name\u2026"
                className={`flex-1 text-base sm:text-sm border rounded-lg px-2 py-1 focus:outline-none focus:border-secondary transition-colors ${
                  dark
                    ? 'border-sidebar-input-border bg-sidebar-input text-sidebar-text placeholder:text-sidebar-muted'
                    : 'border-gray-200 bg-canvas'
                }`}
                autoFocus
              />
              <button onClick={handleCreateNew} className="p-1 text-success cursor-pointer">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewInput(true)}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-sm text-secondary rounded-lg transition-colors duration-150 cursor-pointer ${
                dark ? 'hover:bg-sidebar-hover' : 'hover:bg-soft-accent'
              }`}
            >
              <Plus size={14} />
              New timeline
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

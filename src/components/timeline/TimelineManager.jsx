import { useState, useRef, useEffect } from 'react'
import { FolderOpen, Plus, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

export default function TimelineManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [newName, setNewName] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const menuRef = useRef(null)

  const {
    timelines,
    activeTimelineId,
    events,
    saveCurrentAsTimeline,
    loadTimeline,
    deleteTimeline,
    createNewTimeline,
    updateTimelineName,
    showToast,
  } = useTimelineStore()

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
        setShowNewInput(false)
        setRenaming(null)
        setConfirmDelete(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
    if (confirmDelete === id) {
      deleteTimeline(id)
      setConfirmDelete(null)
      showToast('Timeline deleted')
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const activeName = timelines.find((t) => t.id === activeTimelineId)?.name

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
        title="Manage timelines"
      >
        <FolderOpen size={14} />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {activeName || 'Projects'}
        </span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-20 mt-1.5 min-w-[260px] rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-1">
              Timelines
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {timelines.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">No saved timelines yet</p>
            )}

            {timelines.map((tl) => (
              <div
                key={tl.id}
                className={`flex items-center gap-2 px-2 py-1.5 mx-1 rounded-lg group ${
                  tl.id === activeTimelineId ? 'bg-accent-light' : 'hover:bg-gray-50'
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
                      className="flex-1 text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:border-accent"
                      autoFocus
                    />
                    <button onClick={() => handleRename(tl.id)} className="p-1 text-success cursor-pointer">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setRenaming(null)} className="p-1 text-gray-400 cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { loadTimeline(tl.id); setIsOpen(false) }}
                      className="flex-1 text-left text-sm text-gray-700 truncate cursor-pointer"
                    >
                      {tl.name}
                      <span className="text-xs text-gray-400 ml-1.5">
                        ({tl.events.length} event{tl.events.length !== 1 ? 's' : ''})
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setRenaming(tl.id); setRenameDraft(tl.name) }}
                        className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                        title="Rename"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={() => handleDelete(tl.id)}
                        className={`p-1 cursor-pointer ${confirmDelete === tl.id ? 'text-error' : 'text-gray-400 hover:text-error'}`}
                        title={confirmDelete === tl.id ? 'Click again to confirm' : 'Delete'}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-2 space-y-1">
            {events.length > 0 && !activeTimelineId && (
              <button
                onClick={handleSaveCurrent}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                <FolderOpen size={13} className="text-gray-400" />
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
                  placeholder="Timeline name…"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-accent"
                  autoFocus
                />
                <button onClick={handleCreateNew} className="p-1 text-success cursor-pointer">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewInput(true)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-accent hover:bg-accent-light rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={13} />
                New timeline
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

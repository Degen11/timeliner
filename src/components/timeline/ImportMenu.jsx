import { Upload, Braces, Table, Calendar, FileText, X } from 'lucide-react'
import useFileImport from '@/hooks/useFileImport'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu'

export default function ImportMenu({ compact = false, inline = false }) {
  const { error, setError, pick, inputs } = useFileImport()

  // Inline mode: render import items for embedding in another DropdownMenu
  if (inline) {
    return (
      <>
        {error && (
          <div className="flex items-start gap-1.5 px-3 py-2 text-xs text-error">
            <X size={12} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pick('json') }}>
          <Braces size={14} className="text-text-muted shrink-0" />
          Import JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pick('csv') }}>
          <Table size={14} className="text-text-muted shrink-0" />
          Import CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pick('ics') }}>
          <Calendar size={14} className="text-text-muted shrink-0" />
          Import Calendar (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pick('markdown') }}>
          <FileText size={14} className="text-text-muted shrink-0" />
          Import Markdown
        </DropdownMenuItem>
        {inputs}
      </>
    )
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) setError(null) }}>
      <DropdownMenuTrigger asChild>
        <button
          className={
            compact
              ? 'rounded-lg p-1.5 text-text-muted hover:text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer'
              : 'flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer'
          }
        >
          <Upload size={14} />
          {!compact && 'Import'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        {error && (
          <div className="flex items-start gap-1.5 px-3 py-2 text-xs text-error">
            <X size={12} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <DropdownMenuItem onSelect={() => pick('json')}>
          <Braces size={14} className="text-text-muted" />
          Import JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => pick('csv')}>
          <Table size={14} className="text-text-muted" />
          Import CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => pick('ics')}>
          <Calendar size={14} className="text-text-muted" />
          Import Calendar (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => pick('markdown')}>
          <FileText size={14} className="text-text-muted" />
          Import Markdown
        </DropdownMenuItem>
        {inputs}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

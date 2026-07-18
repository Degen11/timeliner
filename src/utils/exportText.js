// Lightweight text/print export helpers with no heavy dependencies.
//
// These are split out from exportHelpers.js because they are imported by
// eagerly-loaded components (EventCard, TimelinePage). exportHelpers.js
// statically imports file-saver + papaparse (the ~140 KB gz "export" chunk),
// so importing anything from it would pull that chunk onto the critical path.
// Keeping these here means the heavy formats stay lazy behind ExportModal.
import { formatEventDate, groupByYear } from './dateUtils'
import { escapeHtml, TOAST_DURATION } from './constants'

export function formatEventForClipboard(event) {
  const parts = []
  const date = formatEventDate(event)
  parts.push(date ? `${event.title} · ${date}` : event.title)
  if (event.description) parts.push(event.description)
  if (event.people?.length) parts.push(`People: ${event.people.join(', ')}`)
  if (event.tags?.length) parts.push(`Tags: ${event.tags.join(', ')}`)
  if (event.location) parts.push(`Location: ${event.location}`)
  return parts.join('\n')
}

/**
 * Build the print/PDF HTML document safely using DOM APIs (no innerHTML XSS).
 * Returns the full document as a string.
 */
function buildPrintHTML(events) {
  const yearEntries = groupByYear(events)

  let body = ''

  for (const [year, evts] of yearEntries) {
    body += `<div class="year-group">`
    body += `<div class="year">${escapeHtml(String(year))}</div>`
    for (const e of evts) {
      body += '<div class="event">'
      body += `<div class="event-date">${escapeHtml(e.dateRaw || e.dateStart || 'Unknown')}</div>`
      body += `<div class="event-title">${escapeHtml(e.title || '')}</div>`
      if (e.description) body += `<div class="event-desc">${escapeHtml(e.description)}</div>`
      if (e.flagged) body += `<div class="flagged">⚠ ${escapeHtml(e.flagReason || 'Flagged')}</div>`
      const people = (e.people || [])
        .map((p) => `<span class="badge badge-person">${escapeHtml(p)}</span>`)
        .join('')
      const tags = (e.tags || [])
        .map((t) => `<span class="badge badge-tag">${escapeHtml(t)}</span>`)
        .join('')
      if (people || tags) body += `<div class="badges">${people}${tags}</div>`
      body += '</div>'
    }
    body += '</div>'
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Timeline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #3F3F46; line-height: 1.6; padding: 1.5rem; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 1.5rem; font-weight: 600; color: #18181B; margin-bottom: 0.25rem; }
    .meta { font-size: 0.8rem; color: #71717A; margin-bottom: 1.5rem; border-bottom: 1px solid #E4E4E7; padding-bottom: 1rem; }
    .year { font-size: 1rem; font-weight: 700; color: #171717; margin: 1.25rem 0 0.4rem; border-bottom: 2px solid #171717; padding-bottom: 0.2rem; }
    .event { padding: 0.5rem 0; border-bottom: 1px solid #F4F4F5; page-break-inside: avoid; }
    .event-date { font-size: 0.7rem; color: #71717A; text-transform: uppercase; letter-spacing: 0.03em; }
    .event-title { font-size: 0.85rem; font-weight: 600; color: #18181B; }
    .event-desc { font-size: 0.8rem; color: #71717A; margin-top: 0.15rem; }
    .year-group { page-break-inside: auto; }
    .badges { margin-top: 0.2rem; display: flex; flex-wrap: wrap; gap: 0.2rem; align-items: center; }
    .badge { display: inline-block; font-size: 10px; padding: 3px 7px; border-radius: 9999px; line-height: 1; vertical-align: middle; }
    .badge-person { background: #F5F5F5; color: #525252; }
    .badge-tag { background: #F4F4F5; color: #3F3F46; }
    .flagged { color: #D97706; font-size: 0.7rem; }
    @media print {
      body { padding: 0; }
      .year-group { page-break-inside: auto; }
      .year { page-break-after: avoid; }
      .event { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Timeline</h1>
  <p class="meta">${events.length} event${events.length !== 1 ? 's' : ''} &middot; Printed from Timeliner</p>
  ${body}
</body>
</html>`
}

export function printTimeline(events, showToast) {
  const html = buildPrintHTML(events)
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    showToast?.('Pop-up blocked — please allow pop-ups for this site to print', { variant: 'error', duration: TOAST_DURATION.MEDIUM })
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  // After document.write/close the load event has often already fired, so
  // relying solely on onload can mean print() never runs (esp. Chrome).
  // Trigger directly when the document is already complete, with onload as a
  // fallback for the not-yet-loaded case.
  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
  }
  if (printWindow.document.readyState === 'complete') {
    // Small delay lets styles/layout settle before the print dialog opens.
    setTimeout(triggerPrint, 250)
  } else {
    printWindow.onload = triggerPrint
  }
}

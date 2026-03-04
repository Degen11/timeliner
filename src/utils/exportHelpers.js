import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { formatEventDate, groupByYear } from './dateUtils'

export function exportPlainText(events) {
  const lines = [`Timeline — ${events.length} event${events.length !== 1 ? 's' : ''}`, '']
  for (const [year, yearEvents] of groupByYear(events)) {
    lines.push(`=== ${year} ===`, '')
    for (const e of yearEvents) {
      lines.push(`${formatEventDate(e)}  ${e.title}`)
      if (e.description) lines.push(`  ${e.description}`)
      const meta = []
      if (e.people?.length) meta.push(`People: ${e.people.join(', ')}`)
      if (e.tags?.length) meta.push(`Tags: ${e.tags.join(', ')}`)
      if (e.flagged) meta.push(`Flagged: ${e.flagReason || 'Yes'}`)
      if (meta.length) lines.push(`  ${meta.join(' | ')}`)
      lines.push('')
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, 'timeliner-export.txt')
}

export function exportMarkdown(events) {
  const lines = [`# Timeline`, '', `${events.length} event${events.length !== 1 ? 's' : ''}`, '']
  for (const [year, yearEvents] of groupByYear(events)) {
    lines.push(`## ${year}`, '')
    for (const e of yearEvents) {
      lines.push(`### ${e.title}`)
      lines.push(`**${formatEventDate(e)}**`, '')
      if (e.description) lines.push(e.description, '')
      if (e.people?.length) lines.push(`**People:** ${e.people.join(', ')}`)
      if (e.tags?.length) lines.push(`**Tags:** ${e.tags.join(', ')}`)
      if (e.flagged) lines.push(`> ⚠ ${e.flagReason || 'Flagged'}`)
      lines.push('---', '')
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, 'timeliner-export.md')
}

export function exportJSON(events) {
  const blob = new Blob([JSON.stringify({ events }, null, 2)], {
    type: 'application/json',
  })
  saveAs(blob, 'timeliner-export.json')
}

export function exportCSV(events) {
  const flat = events.map((e) => ({
    title: e.title,
    description: e.description,
    dateStart: e.dateStart,
    dateEnd: e.dateEnd || '',
    dateRaw: e.dateRaw,
    datePrecision: e.datePrecision,
    people: e.people?.join('; ') || '',
    tags: e.tags?.join('; ') || '',
    flagged: e.flagged ? 'Yes' : 'No',
    flagReason: e.flagReason || '',
  }))

  const csv = Papa.unparse(flat)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, 'timeliner-export.csv')
}

/**
 * Build the print/PDF HTML document safely using DOM APIs (no innerHTML XSS).
 * Returns the full document as a Blob URL so it works reliably in all browsers.
 */
function buildPrintHTML(events) {
  const yearEntries = groupByYear(events)

  let body = ''
  const esc = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  for (const [year, evts] of yearEntries) {
    body += `<div class="year">${esc(String(year))}</div>`
    for (const e of evts) {
      body += '<div class="event">'
      body += `<div class="event-date">${esc(e.dateRaw || e.dateStart || 'Unknown')}</div>`
      body += `<div class="event-title">${esc(e.title || '')}</div>`
      if (e.description) body += `<div class="event-desc">${esc(e.description)}</div>`
      if (e.flagged) body += `<div class="flagged">\u26A0 ${esc(e.flagReason || 'Flagged')}</div>`
      const people = (e.people || [])
        .map((p) => `<span class="badge badge-person">${esc(p)}</span>`)
        .join('')
      const tags = (e.tags || [])
        .map((t) => `<span class="badge badge-tag">${esc(t)}</span>`)
        .join('')
      if (people || tags) body += `<div class="badges">${people}${tags}</div>`
      body += '</div>'
    }
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
    .year { font-size: 1rem; font-weight: 700; color: #1E3A5F; margin: 1.25rem 0 0.4rem; border-bottom: 2px solid #1E3A5F; padding-bottom: 0.2rem; }
    .event { padding: 0.5rem 0; border-bottom: 1px solid #F4F4F5; page-break-inside: avoid; }
    .event-date { font-size: 0.7rem; color: #71717A; text-transform: uppercase; letter-spacing: 0.03em; }
    .event-title { font-size: 0.85rem; font-weight: 600; color: #18181B; }
    .event-desc { font-size: 0.8rem; color: #71717A; margin-top: 0.15rem; }
    .badges { margin-top: 0.2rem; }
    .badge { display: inline-block; font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 9999px; margin-right: 0.2rem; }
    .badge-person { background: #DBEAFE; color: #2563EB; }
    .badge-tag { background: #F4F4F5; color: #3F3F46; }
    .flagged { color: #D97706; font-size: 0.7rem; }
    @media print {
      body { padding: 0; }
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

export function printTimeline(events) {
  const html = buildPrintHTML(events)
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => printWindow.print()
}

export async function downloadPDF(events) {
  const { default: html2canvas } = await import('html2canvas')
  const { default: jsPDF } = await import('jspdf')

  const html = buildPrintHTML(events)

  // Render into a hidden iframe to capture
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:720px;height:auto;border:none;'
  document.body.appendChild(iframe)
  iframe.contentDocument.open()
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()

  await new Promise((r) => setTimeout(r, 300))

  const body = iframe.contentDocument.body
  const canvas = await html2canvas(body, {
    scale: 2,
    useCORS: true,
    width: 720,
    windowWidth: 720,
  })

  document.body.removeChild(iframe)

  const imgData = canvas.toDataURL('image/png')
  const pageWidth = 210 // A4 mm
  const pageHeight = 297
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * contentWidth) / canvas.width

  const pdf = new jsPDF('p', 'mm', 'a4')
  let yOffset = 0

  while (yOffset < imgHeight) {
    if (yOffset > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, margin - yOffset, contentWidth, imgHeight)
    yOffset += pageHeight - margin * 2
  }

  pdf.save('timeliner-export.pdf')
}

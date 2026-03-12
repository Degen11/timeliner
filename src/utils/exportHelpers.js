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
  const columns = [
    'Title',
    'Description',
    'Date start',
    'Date end',
    'Date raw',
    'Date precision',
    'People',
    'Tags',
    'Flagged',
    'Flag reason',
  ]

  const flat = events.map((e) => ({
    Title: e.title,
    Description: e.description,
    'Date start': e.dateStart,
    'Date end': e.dateEnd || '',
    'Date raw': e.dateRaw,
    'Date precision': e.datePrecision,
    People: e.people?.join('; ') || '',
    Tags: e.tags?.join('; ') || '',
    Flagged: e.flagged ? 'Yes' : 'No',
    'Flag reason': e.flagReason || '',
  }))

  const csv = Papa.unparse(flat, { columns })
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
    body += `<div class="year-group">`
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
    .year { font-size: 1rem; font-weight: 700; color: #1E3A5F; margin: 1.25rem 0 0.4rem; border-bottom: 2px solid #1E3A5F; padding-bottom: 0.2rem; }
    .event { padding: 0.5rem 0; border-bottom: 1px solid #F4F4F5; page-break-inside: avoid; }
    .event-date { font-size: 0.7rem; color: #71717A; text-transform: uppercase; letter-spacing: 0.03em; }
    .event-title { font-size: 0.85rem; font-weight: 600; color: #18181B; }
    .event-desc { font-size: 0.8rem; color: #71717A; margin-top: 0.15rem; }
    .year-group { page-break-inside: auto; }
    .badges { margin-top: 0.2rem; display: flex; flex-wrap: wrap; gap: 0.2rem; align-items: center; }
    .badge { display: inline-flex; align-items: center; font-size: 0.65rem; padding: 0.15rem 0.45rem; border-radius: 9999px; line-height: 1.4; }
    .badge-person { background: #DBEAFE; color: #2563EB; }
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
    showToast?.('Pop-up blocked — please allow pop-ups for this site to print', { variant: 'error', duration: 5000 })
    return
  }
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

  // Wait for iframe content and fonts to load instead of a fixed timeout
  await new Promise((r) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      clearTimeout(fallback)
      r()
    }
    if (iframe.contentDocument.fonts?.ready) {
      iframe.contentDocument.fonts.ready.then(done)
    } else {
      iframe.contentWindow.onload = done
    }
    // Fallback timeout for environments that don't support fonts.ready
    const fallback = setTimeout(done, 2000)
  })

  const body = iframe.contentDocument.body
  const pageWidth = 210 // A4 mm
  const pageHeight = 297
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  // Walk into each .year-group and capture the year header + individual events.
  // The year header and first event are captured together so they stay on the
  // same page, while subsequent events are captured individually for tight packing.
  const captureOpts = { scale: 2, useCORS: true, width: 720, windowWidth: 720 }

  async function captureElement(el) {
    const canvas = await html2canvas(el, captureOpts)
    return {
      imgData: canvas.toDataURL('image/png'),
      heightMm: (canvas.height * contentWidth) / canvas.width,
    }
  }

  // Collect the h1 + meta paragraph first (non-year-group top-level children)
  const blocks = []
  for (const topChild of Array.from(body.children)) {
    if (topChild.classList.contains('year-group')) {
      const groupChildren = Array.from(topChild.children) // [.year, .event, .event, ...]
      const yearHeader = groupChildren[0]                 // .year div
      const firstEvent = groupChildren[1]                 // first .event

      // Capture year header + first event as a unit to keep them together
      if (yearHeader && firstEvent) {
        // Temporarily wrap them so html2canvas captures both
        const wrapper = iframe.contentDocument.createElement('div')
        topChild.insertBefore(wrapper, yearHeader)
        wrapper.appendChild(yearHeader)
        wrapper.appendChild(firstEvent)
        blocks.push(await captureElement(wrapper))
        // Restore DOM — move children back out of wrapper
        topChild.insertBefore(yearHeader, wrapper)
        topChild.insertBefore(firstEvent, wrapper)
        topChild.removeChild(wrapper)
      } else if (yearHeader) {
        blocks.push(await captureElement(yearHeader))
      }

      // Capture remaining events individually
      for (let j = 2; j < groupChildren.length; j++) {
        blocks.push(await captureElement(groupChildren[j]))
      }
    } else {
      blocks.push(await captureElement(topChild))
    }
  }

  document.body.removeChild(iframe)

  const pdf = new jsPDF('p', 'mm', 'a4')
  let cursorY = margin

  for (const block of blocks) {
    // Start a new page if this block won't fit
    if (cursorY + block.heightMm > pageHeight - margin && cursorY > margin) {
      pdf.addPage()
      cursorY = margin
    }

    // If a single block is taller than a full page, fall back to slicing
    if (block.heightMm > usableHeight) {
      let sliceOffset = 0
      while (sliceOffset < block.heightMm) {
        if (cursorY > margin) {
          pdf.addPage()
          cursorY = margin
        }
        pdf.addImage(block.imgData, 'PNG', margin, cursorY - sliceOffset, contentWidth, block.heightMm)
        sliceOffset += usableHeight
        cursorY = margin
      }
      cursorY = margin + (block.heightMm % usableHeight || usableHeight)
    } else {
      pdf.addImage(block.imgData, 'PNG', margin, cursorY, contentWidth, block.heightMm)
      cursorY += block.heightMm
    }
  }

  pdf.save('timeliner-export.pdf')
}

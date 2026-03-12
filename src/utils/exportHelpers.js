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
    .badge { display: inline-block; font-size: 10px; padding: 3px 7px; border-radius: 9999px; line-height: 1; vertical-align: middle; }
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
  const { default: jsPDF } = await import('jspdf')

  // ─── Layout constants (A4 in mm) ────────────────────────
  const PAGE_W = 210
  const PAGE_H = 297
  const M = 15                     // margin
  const CW = PAGE_W - M * 2       // content width
  const BOTTOM = PAGE_H - M       // bottom margin boundary

  // ─── Colors ─────────────────────────────────────────────
  const COL = {
    title:   [24, 24, 27],         // #18181B
    body:    [63, 63, 70],         // #3F3F46
    muted:   [113, 113, 122],      // #71717A
    year:    [30, 58, 95],         // #1E3A5F
    person:  [37, 99, 235],        // #2563EB
    personBg:[219, 234, 254],      // #DBEAFE
    tagBg:   [244, 244, 245],      // #F4F4F5
    flag:    [217, 119, 6],        // #D97706
    rule:    [228, 228, 231],      // #E4E4E7
    ruleLight:[244, 244, 245],     // #F4F4F5
  }

  const pdf = new jsPDF('p', 'mm', 'a4')
  let y = M

  // ─── Helpers ────────────────────────────────────────────

  /** Ensure `needed` mm of space; if not, add a page. */
  function ensureSpace(needed) {
    if (y + needed > BOTTOM) {
      pdf.addPage()
      y = M
    }
  }

  /** Draw a horizontal rule. */
  function drawRule(color, thickness = 0.3) {
    pdf.setDrawColor(...color)
    pdf.setLineWidth(thickness)
    pdf.line(M, y, M + CW, y)
  }

  /** Word-wrap text and draw it, advancing y. Returns lines drawn. */
  function drawWrapped(text, fontSize, style, color, maxWidth) {
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', style)
    pdf.setTextColor(...color)
    const lines = pdf.splitTextToSize(text, maxWidth || CW)
    const lineH = fontSize * 0.4  // mm per line (tuned for helvetica)
    for (const line of lines) {
      ensureSpace(lineH)
      pdf.text(line, M, y)
      y += lineH
    }
    return lines.length
  }

  /** Draw a rounded pill badge, returns width consumed. */
  function drawBadge(x, text, textColor, bgColor) {
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    const tw = pdf.getTextWidth(text)
    const padX = 2.5
    const padY = 1.2
    const pillW = tw + padX * 2
    const pillH = 3.5
    const r = pillH / 2

    // Background pill
    pdf.setFillColor(...bgColor)
    pdf.roundedRect(x, y - pillH + padY, pillW, pillH, r, r, 'F')

    // Text centered in pill
    pdf.setTextColor(...textColor)
    pdf.text(text, x + padX, y - pillH + padY + pillH / 2 + 0.8)

    return pillW + 1.5 // width + gap
  }

  // ─── Header ─────────────────────────────────────────────

  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...COL.title)
  pdf.text('Timeline', M, y)
  y += 7

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...COL.muted)
  pdf.text(
    `${events.length} event${events.length !== 1 ? 's' : ''}  \u00B7  Exported from Timeliner`,
    M,
    y,
  )
  y += 4

  drawRule(COL.rule, 0.3)
  y += 4

  // ─── Year groups ────────────────────────────────────────

  const yearEntries = groupByYear(events)

  for (const [year, evts] of yearEntries) {
    // Year header — keep header + at least first event together (~25mm)
    ensureSpace(25)

    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...COL.year)
    pdf.text(String(year), M, y)
    y += 1.5
    drawRule(COL.year, 0.6)
    y += 4

    for (let i = 0; i < evts.length; i++) {
      const e = evts[i]

      // Pre-measure this event block to decide if we need a page break.
      // Rough estimate: date(3) + title(4-8) + desc(0-20) + badges(4) + gap(3)
      ensureSpace(14)

      // Date
      const dateStr = (e.dateRaw || e.dateStart || 'Unknown').toUpperCase()
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...COL.muted)
      pdf.text(dateStr, M, y)
      y += 3

      // Title (may wrap)
      drawWrapped(e.title || '', 10.5, 'bold', COL.title)
      y += 0.5

      // Description (may wrap)
      if (e.description) {
        drawWrapped(e.description, 8.5, 'normal', COL.muted)
        y += 0.5
      }

      // Flagged
      if (e.flagged) {
        drawWrapped(`\u26A0 ${e.flagReason || 'Flagged'}`, 7.5, 'normal', COL.flag)
        y += 0.5
      }

      // Badges (people + tags)
      const people = e.people || []
      const tags = e.tags || []
      if (people.length || tags.length) {
        ensureSpace(5)
        let bx = M
        for (const p of people) {
          const w = drawBadge(bx, p, COL.person, COL.personBg)
          bx += w
          if (bx > M + CW - 20) { bx = M; y += 4.5 }
        }
        for (const t of tags) {
          const w = drawBadge(bx, t, COL.body, COL.tagBg)
          bx += w
          if (bx > M + CW - 20) { bx = M; y += 4.5 }
        }
        y += 3
      }

      // Event separator
      y += 1.5
      if (i < evts.length - 1) {
        drawRule(COL.ruleLight, 0.2)
        y += 3
      }
    }

    y += 2
  }

  pdf.save('timeliner-export.pdf')
}

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
  const M = 15                     // page margin
  const CW = PAGE_W - M * 2       // content width
  const BOTTOM = PAGE_H - M       // bottom boundary
  const CP = 5                     // card internal padding
  const CARD_W = CW               // card width
  const CARD_INNER = CARD_W - CP * 2  // text area inside card
  const CARD_R = 2.5              // card corner radius
  const CARD_GAP = 3.5            // gap between cards
  const LINE_SCALE = 0.5          // fontSize * this = line height in mm

  // ─── Colors ─────────────────────────────────────────────
  const COL = {
    title:   [24, 24, 27],         // #18181B
    body:    [63, 63, 70],         // #3F3F46
    muted:   [113, 113, 122],      // #71717A
    year:    [30, 58, 95],         // #1E3A5F
    yearBg:  [239, 246, 255],      // #EFF6FF
    person:  [37, 99, 235],        // #2563EB
    personBg:[219, 234, 254],      // #DBEAFE
    tagBg:   [241, 245, 249],      // #F1F5F9
    flag:    [217, 119, 6],        // #D97706
    cardBg:  [255, 255, 255],      // #FFFFFF
    cardBorder: [226, 232, 240],   // #E2E8F0
    pageBg:  [248, 250, 252],      // #F8FAFC
  }

  const pdf = new jsPDF('p', 'mm', 'a4')
  let y = M

  // ─── Helpers ────────────────────────────────────────────

  function ensureSpace(needed) {
    if (y + needed > BOTTOM) { pdf.addPage(); y = M }
  }

  /** Measure how many lines text wraps to at a given font config. */
  function measureLines(text, fontSize, style, maxW) {
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', style)
    return pdf.splitTextToSize(text, maxW)
  }

  /** Measure badge row width to determine if wrapping is needed. */
  function measureBadgeRows(items) {
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    let rows = 1, x = 0
    const pillPad = 5, gap = 1.5
    for (const item of items) {
      const w = pdf.getTextWidth(item) + pillPad + gap
      if (x + w > CARD_INNER && x > 0) { rows++; x = 0 }
      x += w
    }
    return rows
  }

  /** Pre-measure an event card's total height. */
  function measureCard(e) {
    let h = CP // top padding

    // Date line
    h += 3.5 + 1.5 // date text + gap below

    // Title
    const titleLines = measureLines(e.title || '', 11, 'bold', CARD_INNER)
    h += titleLines.length * (11 * LINE_SCALE) + 1.5

    // Description
    if (e.description) {
      const descLines = measureLines(e.description, 8.5, 'normal', CARD_INNER)
      h += descLines.length * (8.5 * LINE_SCALE) + 1.5
    }

    // Flagged
    if (e.flagged) {
      const flagText = `\u26A0 ${e.flagReason || 'Flagged'}`
      const flagLines = measureLines(flagText, 7.5, 'normal', CARD_INNER)
      h += flagLines.length * (7.5 * LINE_SCALE) + 1.5
    }

    // Badges
    const allBadges = [...(e.people || []), ...(e.tags || [])]
    if (allBadges.length) {
      const rows = measureBadgeRows(allBadges)
      h += rows * 5 + 1
    }

    h += CP // bottom padding
    return h
  }

  /** Draw text at (x, y), advance y by lineH per line. */
  function drawText(x, text, fontSize, style, color, maxW) {
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', style)
    pdf.setTextColor(...color)
    const lines = pdf.splitTextToSize(text, maxW)
    const lineH = fontSize * LINE_SCALE
    for (const line of lines) {
      pdf.text(line, x, y)
      y += lineH
    }
  }

  /** Draw a pill badge at (x, badgeY). Returns width consumed. */
  function drawBadge(x, badgeY, text, textColor, bgColor) {
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    const tw = pdf.getTextWidth(text)
    const padX = 2.5
    const pillW = tw + padX * 2
    const pillH = 3.8
    const r = pillH / 2

    pdf.setFillColor(...bgColor)
    pdf.roundedRect(x, badgeY, pillW, pillH, r, r, 'F')

    pdf.setTextColor(...textColor)
    pdf.text(text, x + padX, badgeY + pillH / 2 + 0.9)

    return pillW + 1.5
  }

  // ─── Page background ───────────────────────────────────
  function drawPageBg() {
    pdf.setFillColor(...COL.pageBg)
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')
  }
  drawPageBg()

  // Hook into addPage to draw bg on every new page
  const origAddPage = pdf.addPage.bind(pdf)
  pdf.addPage = (...args) => { origAddPage(...args); drawPageBg() }

  // ─── Header ─────────────────────────────────────────────

  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...COL.title)
  pdf.text('Timeline', M, y)
  y += 8

  pdf.setFontSize(8.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...COL.muted)
  pdf.text(
    `${events.length} event${events.length !== 1 ? 's' : ''}  \u00B7  Exported from Timeliner`,
    M, y,
  )
  y += 6

  // ─── Year groups ────────────────────────────────────────

  const yearEntries = groupByYear(events)

  for (const [year, evts] of yearEntries) {
    // Year header — pill-style label
    ensureSpace(14)
    const yearStr = String(year)
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    const yearW = pdf.getTextWidth(yearStr) + 8
    const yearH = 8

    // Year pill background
    pdf.setFillColor(...COL.yearBg)
    pdf.roundedRect(M, y, yearW, yearH, 2, 2, 'F')

    // Left accent bar inside pill
    pdf.setFillColor(...COL.year)
    pdf.roundedRect(M, y, 1.2, yearH, 0.6, 0.6, 'F')

    // Year text
    pdf.setTextColor(...COL.year)
    pdf.text(yearStr, M + 4, y + yearH / 2 + 1.5)
    y += yearH + 4

    // Event cards
    for (const e of evts) {
      const cardH = measureCard(e)

      // If the card doesn't fit, start a new page
      ensureSpace(cardH + CARD_GAP)

      const cardTop = y

      // Card background
      pdf.setFillColor(...COL.cardBg)
      pdf.roundedRect(M, cardTop, CARD_W, cardH, CARD_R, CARD_R, 'F')

      // Card border
      pdf.setDrawColor(...COL.cardBorder)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(M, cardTop, CARD_W, cardH, CARD_R, CARD_R, 'S')

      // Left accent bar (subtle blue)
      pdf.setFillColor(...COL.year)
      pdf.roundedRect(M, cardTop, 1, cardH, CARD_R, 0, 'F')
      // Clip fix: overdraw the left edge cleanly
      pdf.setFillColor(...COL.year)
      pdf.rect(M + 0.5, cardTop + CARD_R, 0.5, cardH - CARD_R * 2, 'F')

      const cx = M + CP  // content x start
      y = cardTop + CP   // content y start

      // Date
      const dateStr = (e.dateRaw || e.dateStart || 'Unknown').toUpperCase()
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...COL.muted)
      pdf.text(dateStr, cx, y + 2.5)
      y += 3.5 + 1.5

      // Title
      drawText(cx, e.title || '', 11, 'bold', COL.title, CARD_INNER)
      y += 1.5

      // Description
      if (e.description) {
        drawText(cx, e.description, 8.5, 'normal', COL.muted, CARD_INNER)
        y += 1.5
      }

      // Flagged
      if (e.flagged) {
        drawText(cx, `\u26A0 ${e.flagReason || 'Flagged'}`, 7.5, 'normal', COL.flag, CARD_INNER)
        y += 1.5
      }

      // Badges
      const people = e.people || []
      const tags = e.tags || []
      if (people.length || tags.length) {
        y += 0.5
        let bx = cx
        const badgeY = y
        let currentBadgeY = badgeY
        for (const p of people) {
          const w = drawBadge(bx, currentBadgeY, p, COL.person, COL.personBg)
          bx += w
          if (bx > cx + CARD_INNER - 15) { bx = cx; currentBadgeY += 5 }
        }
        for (const t of tags) {
          const w = drawBadge(bx, currentBadgeY, t, COL.body, COL.tagBg)
          bx += w
          if (bx > cx + CARD_INNER - 15) { bx = cx; currentBadgeY += 5 }
        }
      }

      // Move past the card
      y = cardTop + cardH + CARD_GAP
    }

    y += 2 // extra space between year groups
  }

  pdf.save('timeliner-export.pdf')
}

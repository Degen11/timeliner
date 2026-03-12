import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { formatEventDate, groupByYear } from './dateUtils'
import { getTagPalette } from './constants'

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
  const M = 18                     // page margin
  const CW = PAGE_W - M * 2       // content width
  const BOTTOM = PAGE_H - M       // bottom boundary
  const CP = 4                     // card internal padding (tighter)
  const ACCENT_W = 1.2            // left accent bar width
  const CARD_W = CW               // card width
  const CARD_INNER = CARD_W - CP * 2 - ACCENT_W  // text area inside card
  const CARD_R = 3                // card corner radius
  const CARD_GAP = 3              // gap between cards
  const LINE_H = 0.5              // fontSize * this = line height in mm
  const YEAR_PILL_H = 7.5         // year pill height
  const YEAR_GAP = 4              // gap after year pill before first card

  // ─── Colors — refined neutral palette ──────────────────
  const COL = {
    title:   [17, 24, 39],         // #111827
    body:    [55, 65, 81],         // #374151
    muted:   [107, 114, 128],      // #6B7280
    subtle:  [156, 163, 175],      // #9CA3AF
    accent:  [59, 130, 246],       // #3B82F6
    yearBg:  [243, 244, 246],      // #F3F4F6
    personBg:[219, 234, 254],      // #DBEAFE
    personTx:[30, 64, 175],        // #1E40AF
    cardBg:  [255, 255, 255],      // #FFFFFF
    shadow:  [0, 0, 0],
    pageBg:  [249, 250, 251],      // #F9FAFB
    divider: [229, 231, 235],      // #E5E7EB
    link:    [59, 130, 246],       // #3B82F6
  }

  /** Convert a hex color string (#RRGGBB) to [r, g, b] array. */
  function hexToRgb(hex) {
    const h = hex.replace('#', '')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }

  const pdf = new jsPDF('p', 'mm', 'a4')
  let y = M

  // ─── Helpers ────────────────────────────────────────────

  function ensureSpace(needed) {
    if (y + needed > BOTTOM) { pdf.addPage(); y = M }
  }

  function measureLines(text, fontSize, style, maxW) {
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', style)
    return pdf.splitTextToSize(text, maxW)
  }

  function measureBadgeRows(items, bold) {
    let rows = 1, x = 0
    for (const item of items) {
      pdf.setFontSize(7)
      pdf.setFont('helvetica', bold ? 'bold' : 'normal')
      const w = pdf.getTextWidth(item) + 6 + 2
      if (x + w > CARD_INNER && x > 0) { rows++; x = 0 }
      x += w
    }
    return rows
  }

  /** Pre-measure an event card's total height. */
  function measureCard(e) {
    let h = CP + 2 // top padding + breathing room above date

    // Date
    h += 3 + 3.5 // date text + gap to title

    // Title
    const titleLines = measureLines(e.title || '', 11.5, 'bold', CARD_INNER)
    h += titleLines.length * (11.5 * LINE_H) + 1.5

    // Description
    if (e.description) {
      const descLines = measureLines(e.description, 8.5, 'normal', CARD_INNER)
      h += descLines.length * (8.5 * LINE_H) + 1.5
    }

    // Badges
    const people = e.people || []
    const tags = e.tags || []
    if (people.length || tags.length) {
      let totalRows = 0
      if (people.length) totalRows += measureBadgeRows(people, true)
      if (tags.length) totalRows += measureBadgeRows(tags, false)
      h += totalRows * 5.5
    }

    h += 1.5 // bottom padding (tight below badges)
    return h
  }

  /** Draw text at current y, advance y. */
  function drawText(x, text, fontSize, style, color, maxW) {
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', style)
    pdf.setTextColor(...color)
    const lines = pdf.splitTextToSize(text, maxW)
    const lineH = fontSize * LINE_H
    for (const line of lines) {
      pdf.text(line, x, y)
      y += lineH
    }
  }

  /** Draw a pill badge. Returns width consumed. */
  function drawBadge(x, badgeY, text, textColor, bgColor, bold) {
    pdf.setFontSize(7)
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    const tw = pdf.getTextWidth(text)
    const padX = 3
    const pillW = tw + padX * 2
    const pillH = 4.2
    const r = pillH / 2

    pdf.setFillColor(...bgColor)
    pdf.roundedRect(x, badgeY, pillW, pillH, r, r, 'F')

    pdf.setTextColor(...textColor)
    pdf.text(text, x + padX, badgeY + pillH / 2 + 0.8)

    return pillW + 2
  }

  // ─── Page background ───────────────────────────────────
  function drawPageBg() {
    pdf.setFillColor(...COL.pageBg)
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')
  }
  drawPageBg()

  const origAddPage = pdf.addPage.bind(pdf)
  pdf.addPage = (...args) => { origAddPage(...args); drawPageBg() }

  // ─── Subtle card shadow (layered translucent rects) ────
  function drawCardShadow(x, top, w, h) {
    pdf.setGState(new pdf.GState({ opacity: 0.04 }))
    pdf.setFillColor(...COL.shadow)
    pdf.roundedRect(x + 0.3, top + 0.6, w, h, CARD_R, CARD_R, 'F')
    pdf.setGState(new pdf.GState({ opacity: 0.03 }))
    pdf.roundedRect(x + 0.6, top + 1.2, w, h, CARD_R + 0.5, CARD_R + 0.5, 'F')
    pdf.setGState(new pdf.GState({ opacity: 1 }))
  }

  /** Draw the left accent bar with proper rounded corners. */
  function drawAccentBar(cardTop, cardH) {
    pdf.setFillColor(...COL.accent)
    pdf.roundedRect(M, cardTop, ACCENT_W + CARD_R, cardH, CARD_R, CARD_R, 'F')
    pdf.setFillColor(...COL.accent)
    pdf.rect(M + ACCENT_W, cardTop, CARD_R, cardH, 'F')
    pdf.setFillColor(...COL.cardBg)
    pdf.roundedRect(M + ACCENT_W, cardTop, CARD_W - ACCENT_W, cardH, CARD_R, CARD_R, 'F')
    pdf.setFillColor(...COL.accent)
    pdf.rect(M, cardTop + CARD_R, ACCENT_W, cardH - CARD_R * 2, 'F')
    pdf.setFillColor(...COL.accent)
    pdf.roundedRect(M, cardTop, ACCENT_W + CARD_R, CARD_R * 2, CARD_R, CARD_R, 'F')
    pdf.setFillColor(...COL.cardBg)
    pdf.rect(M + ACCENT_W, cardTop, CARD_R, CARD_R * 2, 'F')
    pdf.setFillColor(...COL.accent)
    pdf.roundedRect(M, cardTop + cardH - CARD_R * 2, ACCENT_W + CARD_R, CARD_R * 2, CARD_R, CARD_R, 'F')
    pdf.setFillColor(...COL.cardBg)
    pdf.rect(M + ACCENT_W, cardTop + cardH - CARD_R * 2, CARD_R, CARD_R * 2, 'F')
  }

  // ─── Header ─────────────────────────────────────────────

  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...COL.title)
  pdf.text('Timeline', M, y)
  y += 7

  const countText = `${events.length} event${events.length !== 1 ? 's' : ''}  \u00B7  Exported from `
  pdf.setFontSize(8.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...COL.muted)
  pdf.text(countText, M, y)
  const countW = pdf.getTextWidth(countText)

  pdf.setTextColor(...COL.link)
  pdf.setFont('helvetica', 'bold')
  pdf.textWithLink('Timeliner', M + countW, y, { url: 'https://timeliner.app' })
  y += 4

  pdf.setDrawColor(...COL.divider)
  pdf.setLineWidth(0.3)
  pdf.line(M, y, M + CW, y)
  y += 6

  // ─── Year groups ────────────────────────────────────────

  const yearEntries = groupByYear(events)

  for (const [year, evts] of yearEntries) {
    // Measure first card so year header + first card stay together
    const firstCardH = measureCard(evts[0])
    const yearBlockH = YEAR_PILL_H + YEAR_GAP + firstCardH
    ensureSpace(yearBlockH)

    // Year pill
    const yearStr = String(year)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    const yearTextW = pdf.getTextWidth(yearStr)
    const yearPillW = yearTextW + 10

    pdf.setFillColor(...COL.yearBg)
    pdf.roundedRect(M, y, yearPillW, YEAR_PILL_H, YEAR_PILL_H / 2, YEAR_PILL_H / 2, 'F')

    pdf.setTextColor(...COL.title)
    pdf.text(yearStr, M + 5, y + YEAR_PILL_H / 2 + 1.2)
    y += YEAR_PILL_H + YEAR_GAP

    // Event cards
    for (const e of evts) {
      const cardH = measureCard(e)
      ensureSpace(cardH + CARD_GAP)

      const cardTop = y

      drawCardShadow(M, cardTop, CARD_W, cardH)

      pdf.setFillColor(...COL.cardBg)
      pdf.roundedRect(M, cardTop, CARD_W, cardH, CARD_R, CARD_R, 'F')

      drawAccentBar(cardTop, cardH)

      const cx = M + ACCENT_W + CP
      y = cardTop + CP + 2

      // Date
      const dateStr = (e.dateRaw || e.dateStart || 'Unknown').toUpperCase()
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...COL.subtle)
      pdf.text(dateStr, cx, y)
      y += 5.5

      // Title
      drawText(cx, e.title || '', 11.5, 'bold', COL.title, CARD_INNER)
      y += 1.5

      // Description
      if (e.description) {
        drawText(cx, e.description, 8.5, 'normal', COL.body, CARD_INNER)
        y += 1.5
      }

      // Badges — people then color-coded tags
      const people = e.people || []
      const tags = e.tags || []
      if (people.length || tags.length) {
        let bx = cx
        let currentBadgeY = y
        for (const p of people) {
          const w = drawBadge(bx, currentBadgeY, p, COL.personTx, COL.personBg, true)
          bx += w
          if (bx > cx + CARD_INNER - 12) { bx = cx; currentBadgeY += 5.5 }
        }
        for (const t of tags) {
          const palette = getTagPalette(t)
          const bgRgb = hexToRgb(palette.bg)
          const txRgb = hexToRgb(palette.text)
          const w = drawBadge(bx, currentBadgeY, t, txRgb, bgRgb, false)
          bx += w
          if (bx > cx + CARD_INNER - 12) { bx = cx; currentBadgeY += 5.5 }
        }
      }

      y = cardTop + cardH + CARD_GAP
    }

    y += 2 // breathing room between year groups
  }

  // ─── Footer on last page ──────────────────────────────
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...COL.subtle)
  const footerText = 'Generated with Timeliner \u00B7 timeliner.app'
  const footerW = pdf.getTextWidth(footerText)
  pdf.text(footerText, (PAGE_W - footerW) / 2, PAGE_H - 8)

  pdf.save('timeliner-export.pdf')
}

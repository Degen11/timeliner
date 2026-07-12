import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { formatEventDate, groupByYear } from './dateUtils'
import { getTagPalette, getEventColor, escapeHtml, TOAST_DURATION } from './constants'

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

  for (const [year, evts] of yearEntries) {
    body += `<div class="year-group">`
    body += `<div class="year">${escapeHtml(String(year))}</div>`
    for (const e of evts) {
      body += '<div class="event">'
      body += `<div class="event-date">${escapeHtml(e.dateRaw || e.dateStart || 'Unknown')}</div>`
      body += `<div class="event-title">${escapeHtml(e.title || '')}</div>`
      if (e.description) body += `<div class="event-desc">${escapeHtml(e.description)}</div>`
      if (e.flagged) body += `<div class="flagged">\u26A0 ${escapeHtml(e.flagReason || 'Flagged')}</div>`
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
    accent:  [82, 82, 82],          // #525252
    yearBg:  [245, 245, 244],      // #F5F5F4
    personBg:[245, 245, 245],      // #F5F5F5
    personTx:[82, 82, 82],         // #525252
    cardBg:  [255, 255, 255],      // #FFFFFF
    shadow:  [0, 0, 0],
    pageBg:  [250, 250, 249],      // #FAFAF9
    divider: [229, 229, 229],      // #E5E5E5
    link:    [82, 82, 82],         // #525252
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

  // Serif header — matches the app's Newsreader chronicle voice
  pdf.setFontSize(22)
  pdf.setFont('times', 'bold')
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

    // Year pill — serif numerals like the app's spine labels
    const yearStr = String(year)
    pdf.setFontSize(14)
    pdf.setFont('times', 'bold')
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

      // Date — quiet serif eyebrow (normal case, like the cards)
      const dateStr = e.dateRaw || e.dateStart || 'Unknown'
      pdf.setFontSize(8.5)
      pdf.setFont('times', 'normal')
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

// \u2500\u2500\u2500 PNG poster export \u2014 chronicle-style shareable image \u2500\u2500

const POSTER = {
  width: 1200,
  pad: 72,
  scale: 2,
  maxEvents: 40,
  gutter: 168,       // year numeral column
  bg: '#f7f5f1',
  ink: '#1c1917',
  body: '#404040',
  muted: '#6b6b6b',
  spine: '#d4d4d4',
  cardBg: '#ffffff',
  cardBorder: '#e5e5e5',
  serif: 'Newsreader, Georgia, serif',
  sans: 'Inter, system-ui, sans-serif',
}

/** Wrap text into at most maxLines lines, ellipsizing the last. */
function posterWrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word
    if (ctx.measureText(attempt).width <= maxWidth || !line) {
      line = attempt
    } else {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length === maxLines && (line !== lines[maxLines - 1] || ctx.measureText(line).width > maxWidth)) {
    let last = lines[maxLines - 1]
    while (last.length > 1 && ctx.measureText(`${last}\u2026`).width > maxWidth) {
      last = last.slice(0, -1)
    }
    lines[maxLines - 1] = `${last}\u2026`
  }
  return lines
}

/** Single line, ellipsized to fit. */
function posterTruncate(ctx, text, maxWidth) {
  let s = String(text)
  if (ctx.measureText(s).width <= maxWidth) return s
  while (s.length > 1 && ctx.measureText(`${s}\u2026`).width > maxWidth) {
    s = s.slice(0, -1)
  }
  return `${s}\u2026`
}

/**
 * Render the timeline as a chronicle-style PNG poster: warm paper background,
 * serif year numerals on a spine, tag-colored cards. Caps at POSTER.maxEvents
 * with a note so long timelines stay poster-sized.
 */
export async function downloadPoster(events, title = 'Timeline') {
  const P = POSTER

  // Make sure the display fonts are in before measuring (best-effort)
  try {
    await Promise.all([
      document.fonts.load(`600 46px ${P.serif}`),
      document.fonts.load(`500 34px ${P.serif}`),
      document.fonts.load(`600 21px ${P.sans}`),
      document.fonts.load(`400 15px ${P.sans}`),
    ])
  } catch { /* system font fallback is acceptable */ }

  const isCapped = events.length > P.maxEvents
  const visible = isCapped ? events.slice(0, P.maxEvents) : events
  const yearEntries = groupByYear(visible)

  const CARD_X = P.pad + P.gutter
  const CARD_W = P.width - CARD_X - P.pad
  const TEXT_X = CARD_X + 30
  const TEXT_W = CARD_W - 60
  const HEADER_H = 158
  const FOOTER_H = 84
  const CARD_GAP = 16
  const GROUP_GAP = 28

  const measure = document.createElement('canvas').getContext('2d')

  // Measure cards
  const layout = yearEntries.map(([year, evts]) => ({
    year,
    cards: evts.map((e) => {
      measure.font = `600 21px ${P.sans}`
      const titleLines = posterWrapText(measure, e.title || '', TEXT_W, 2)
      measure.font = `400 15px ${P.sans}`
      const descLine = e.description ? posterTruncate(measure, e.description, TEXT_W) : null
      // top pad + date + gap + title lines + optional desc + bottom pad
      const h = 22 + 20 + 8 + titleLines.length * 28 + (descLine ? 24 : 0) + 20
      return { e, titleLines, descLine, h }
    }),
  }))

  const bodyH = layout.reduce(
    (sum, g) => sum + g.cards.reduce((s, c) => s + c.h + CARD_GAP, 0) + GROUP_GAP,
    0
  )
  const H = HEADER_H + bodyH + FOOTER_H

  const canvas = document.createElement('canvas')
  canvas.width = P.width * P.scale
  canvas.height = H * P.scale
  const ctx = canvas.getContext('2d')
  ctx.scale(P.scale, P.scale)

  // Paper
  ctx.fillStyle = P.bg
  ctx.fillRect(0, 0, P.width, H)

  // Header
  ctx.fillStyle = P.ink
  ctx.font = `600 46px ${P.serif}`
  ctx.fillText(posterTruncate(ctx, title, P.width - P.pad * 2), P.pad, P.pad + 34)

  const years = yearEntries.map(([y]) => y).filter((y) => y !== 'Unknown')
  const range = years.length > 1 ? `${years[0]} \u2013 ${years[years.length - 1]} \u00B7 ` : ''
  ctx.fillStyle = P.muted
  ctx.font = `500 20px ${P.serif}`
  ctx.fillText(`${range}${events.length} event${events.length !== 1 ? 's' : ''}`, P.pad, P.pad + 68)

  ctx.strokeStyle = P.cardBorder
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(P.pad, HEADER_H - 24)
  ctx.lineTo(P.width - P.pad, HEADER_H - 24)
  ctx.stroke()

  // Body
  let y = HEADER_H
  const spineX = CARD_X - 26

  for (const group of layout) {
    const groupTop = y
    const groupH = group.cards.reduce((s, c) => s + c.h + CARD_GAP, 0) - CARD_GAP

    // Spine segment
    ctx.strokeStyle = P.spine
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(spineX, groupTop + 4)
    ctx.lineTo(spineX, groupTop + groupH - 4)
    ctx.stroke()

    // Year numeral
    ctx.fillStyle = P.ink
    ctx.font = `500 34px ${P.serif}`
    ctx.textAlign = 'right'
    ctx.fillText(String(group.year), spineX - 22, groupTop + 30)
    ctx.textAlign = 'left'

    for (const card of group.cards) {
      const color = getEventColor(card.e).dot

      // Card
      ctx.fillStyle = P.cardBg
      ctx.strokeStyle = P.cardBorder
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(CARD_X, y, CARD_W, card.h, 12)
      ctx.fill()
      ctx.stroke()

      // Tag-color edge
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(CARD_X, y, 4, card.h, [12, 0, 0, 12])
      ctx.fill()

      // Dot on the spine
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(spineX, y + 26, 6, 0, Math.PI * 2)
      ctx.fill()

      // Date (serif eyebrow)
      let ty = y + 22 + 14
      ctx.fillStyle = P.muted
      ctx.font = `500 17px ${P.serif}`
      ctx.fillText(posterTruncate(ctx, formatEventDate(card.e), TEXT_W), TEXT_X, ty)
      ty += 30

      // Title
      ctx.fillStyle = P.ink
      ctx.font = `600 21px ${P.sans}`
      for (const line of card.titleLines) {
        ctx.fillText(line, TEXT_X, ty)
        ty += 28
      }

      // Description
      if (card.descLine) {
        ctx.fillStyle = P.body
        ctx.font = `400 15px ${P.sans}`
        ctx.fillText(card.descLine, TEXT_X, ty)
      }

      y += card.h + CARD_GAP
    }

    y += GROUP_GAP - CARD_GAP
  }

  // Footer
  ctx.fillStyle = P.muted
  ctx.font = `400 15px ${P.sans}`
  ctx.textAlign = 'center'
  const footer = isCapped
    ? `Showing first ${P.maxEvents} of ${events.length} events \u00B7 Made with Timeliner \u00B7 timeliner.app`
    : 'Made with Timeliner \u00B7 timeliner.app'
  ctx.fillText(footer, P.width / 2, H - 34)
  ctx.textAlign = 'left'

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Poster render failed'))), 'image/png')
  })
  saveAs(blob, 'timeline-poster.png')
}

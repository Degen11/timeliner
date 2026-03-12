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
  const M = 18                     // page margin
  const CW = PAGE_W - M * 2       // content width
  const BOTTOM = PAGE_H - M       // bottom boundary
  const CP = 6                     // card internal padding
  const ACCENT_W = 1.2            // left accent bar width
  const CARD_W = CW               // card width
  const CARD_INNER = CARD_W - CP * 2 - ACCENT_W  // text area inside card
  const CARD_R = 3                // card corner radius
  const CARD_GAP = 4              // gap between cards
  const LINE_H = 0.5              // fontSize * this = line height in mm

  // ─── Colors — refined neutral palette ──────────────────
  const COL = {
    title:   [17, 24, 39],         // #111827  — near-black for max contrast
    body:    [55, 65, 81],         // #374151
    muted:   [107, 114, 128],      // #6B7280
    subtle:  [156, 163, 175],      // #9CA3AF  — dates, secondary info
    accent:  [59, 130, 246],       // #3B82F6  — primary blue
    accentDk:[37, 99, 235],        // #2563EB  — darker accent for text
    yearBg:  [243, 244, 246],      // #F3F4F6
    personBg:[219, 234, 254],      // #DBEAFE
    personTx:[30, 64, 175],        // #1E40AF
    tagBg:   [243, 244, 246],      // #F3F4F6
    tagTx:   [55, 65, 81],         // #374151
    flag:    [217, 119, 6],        // #D97706
    cardBg:  [255, 255, 255],      // #FFFFFF
    shadow:  [0, 0, 0],           // shadow color (used with opacity)
    pageBg:  [249, 250, 251],      // #F9FAFB
    divider: [229, 231, 235],      // #E5E7EB
    link:    [59, 130, 246],       // #3B82F6
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

  function measureBadgeRows(items, isPerson) {
    let rows = 1, x = 0
    for (const item of items) {
      pdf.setFontSize(7)
      pdf.setFont('helvetica', isPerson ? 'bold' : 'normal')
      const w = pdf.getTextWidth(item) + 6 + 2 // padX*2 + gap
      if (x + w > CARD_INNER && x > 0) { rows++; x = 0 }
      x += w
    }
    return rows
  }

  /** Pre-measure an event card's total height. */
  function measureCard(e) {
    let h = CP + 1 // top padding + extra breathing room

    // Date
    h += 3 + 2.5 // date text height + gap to title

    // Title
    const titleLines = measureLines(e.title || '', 11.5, 'bold', CARD_INNER)
    h += titleLines.length * (11.5 * LINE_H) + 3

    // Description
    if (e.description) {
      const descLines = measureLines(e.description, 8.5, 'normal', CARD_INNER)
      h += descLines.length * (8.5 * LINE_H) + 2.5
    }

    // Flagged
    if (e.flagged) {
      const flagText = `\u26A0 ${e.flagReason || 'Flagged'}`
      const flagLines = measureLines(flagText, 7.5, 'normal', CARD_INNER)
      h += flagLines.length * (7.5 * LINE_H) + 2
    }

    // Badges
    const people = e.people || []
    const tags = e.tags || []
    if (people.length || tags.length) {
      let totalRows = 0
      if (people.length) totalRows += measureBadgeRows(people, true)
      if (tags.length) totalRows += measureBadgeRows(tags, false)
      h += totalRows * 5.5 + 1.5
    }

    h += CP // bottom padding
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
    // Two-layer soft shadow for depth
    pdf.setGState(new pdf.GState({ opacity: 0.04 }))
    pdf.setFillColor(...COL.shadow)
    pdf.roundedRect(x + 0.3, top + 0.6, w, h, CARD_R, CARD_R, 'F')
    pdf.setGState(new pdf.GState({ opacity: 0.03 }))
    pdf.roundedRect(x + 0.6, top + 1.2, w, h, CARD_R + 0.5, CARD_R + 0.5, 'F')
    // Reset opacity
    pdf.setGState(new pdf.GState({ opacity: 1 }))
  }

  // ─── Header ─────────────────────────────────────────────

  // Title
  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...COL.title)
  pdf.text('Timeline', M, y)
  y += 7

  // Subtitle with clickable "Timeliner" link
  const countText = `${events.length} event${events.length !== 1 ? 's' : ''}  \u00B7  Exported from `
  pdf.setFontSize(8.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...COL.muted)
  pdf.text(countText, M, y)
  const countW = pdf.getTextWidth(countText)

  // "Timeliner" as a clickable link
  pdf.setTextColor(...COL.link)
  pdf.setFont('helvetica', 'bold')
  const linkText = 'Timeliner'
  pdf.textWithLink(linkText, M + countW, y, { url: 'https://timeliner.app' })
  y += 4

  // Divider line
  pdf.setDrawColor(...COL.divider)
  pdf.setLineWidth(0.3)
  pdf.line(M, y, M + CW, y)
  y += 6

  // ─── Year groups ────────────────────────────────────────

  const yearEntries = groupByYear(events)

  for (const [year, evts] of yearEntries) {
    ensureSpace(16)

    // Year header — clean, bold label with subtle background
    const yearStr = String(year)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    const yearTextW = pdf.getTextWidth(yearStr)
    const yearPillW = yearTextW + 10
    const yearPillH = 7.5

    // Pill background
    pdf.setFillColor(...COL.yearBg)
    pdf.roundedRect(M, y, yearPillW, yearPillH, yearPillH / 2, yearPillH / 2, 'F')

    // Year text centered in pill
    pdf.setTextColor(...COL.title)
    pdf.text(yearStr, M + 5, y + yearPillH / 2 + 1.2)
    y += yearPillH + 5

    // Event cards
    for (const e of evts) {
      const cardH = measureCard(e)
      ensureSpace(cardH + CARD_GAP)

      const cardTop = y

      // Shadow
      drawCardShadow(M, cardTop, CARD_W, cardH)

      // Card background
      pdf.setFillColor(...COL.cardBg)
      pdf.roundedRect(M, cardTop, CARD_W, cardH, CARD_R, CARD_R, 'F')

      // Left accent bar — drawn as a clipped rect inside the card's left edge
      pdf.setFillColor(...COL.accent)
      pdf.roundedRect(M, cardTop, ACCENT_W + CARD_R, cardH, CARD_R, CARD_R, 'F')
      // Overdraw right portion to make it a straight edge
      pdf.setFillColor(...COL.accent)
      pdf.rect(M + ACCENT_W, cardTop, CARD_R, cardH, 'F')
      // Redraw the card body over the accent overflow
      pdf.setFillColor(...COL.cardBg)
      pdf.rect(M + ACCENT_W, cardTop, CARD_W - ACCENT_W, cardH, 'F')
      // Re-round the right corners
      pdf.setFillColor(...COL.cardBg)
      pdf.roundedRect(M + ACCENT_W, cardTop, CARD_W - ACCENT_W, cardH, CARD_R, CARD_R, 'F')
      // Re-fill the left strip cleanly
      pdf.setFillColor(...COL.accent)
      pdf.rect(M, cardTop + CARD_R, ACCENT_W, cardH - CARD_R * 2, 'F')
      // Top-left rounded corner
      pdf.setFillColor(...COL.accent)
      pdf.roundedRect(M, cardTop, ACCENT_W + CARD_R, CARD_R * 2, CARD_R, CARD_R, 'F')
      pdf.setFillColor(...COL.cardBg)
      pdf.rect(M + ACCENT_W, cardTop, CARD_R, CARD_R * 2, 'F')
      // Bottom-left rounded corner
      pdf.setFillColor(...COL.accent)
      pdf.roundedRect(M, cardTop + cardH - CARD_R * 2, ACCENT_W + CARD_R, CARD_R * 2, CARD_R, CARD_R, 'F')
      pdf.setFillColor(...COL.cardBg)
      pdf.rect(M + ACCENT_W, cardTop + cardH - CARD_R * 2, CARD_R, CARD_R * 2, 'F')

      const cx = M + ACCENT_W + CP  // content x (after accent bar + padding)
      y = cardTop + CP + 1           // content y (top padding + breathing room)

      // Date — small, uppercase, muted
      const dateStr = (e.dateRaw || e.dateStart || 'Unknown').toUpperCase()
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...COL.subtle)
      pdf.text(dateStr, cx, y)
      y += 5 // clear gap between date and title

      // Title — bold, larger
      drawText(cx, e.title || '', 11.5, 'bold', COL.title, CARD_INNER)
      y += 3

      // Description
      if (e.description) {
        drawText(cx, e.description, 8.5, 'normal', COL.body, CARD_INNER)
        y += 2.5
      }

      // Flagged
      if (e.flagged) {
        drawText(cx, `\u26A0 ${e.flagReason || 'Flagged'}`, 7.5, 'normal', COL.flag, CARD_INNER)
        y += 2
      }

      // Badges — people then tags
      const people = e.people || []
      const tags = e.tags || []
      if (people.length || tags.length) {
        y += 1
        let bx = cx
        let currentBadgeY = y
        for (const p of people) {
          const w = drawBadge(bx, currentBadgeY, p, COL.personTx, COL.personBg, true)
          bx += w
          if (bx > cx + CARD_INNER - 12) { bx = cx; currentBadgeY += 5.5 }
        }
        for (const t of tags) {
          const w = drawBadge(bx, currentBadgeY, t, COL.tagTx, COL.tagBg, false)
          bx += w
          if (bx > cx + CARD_INNER - 12) { bx = cx; currentBadgeY += 5.5 }
        }
      }

      y = cardTop + cardH + CARD_GAP
    }

    y += 3 // breathing room between year groups
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

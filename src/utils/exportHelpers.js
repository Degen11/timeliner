import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { formatEventDate, safeGetUTCYear, safeDateCompare } from './dateUtils'

function groupByYear(events) {
  const sorted = [...events].sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))
  const groups = {}
  for (const e of sorted) {
    const year = safeGetUTCYear(e.dateStart, 'Unknown')
    if (!groups[year]) groups[year] = []
    groups[year].push(e)
  }
  return Object.entries(groups).sort(([a], [b]) => (a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a - b))
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

export function printTimeline(events) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Timeline Print</title>
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
  <div id="timeline"></div>
  <script>
    function esc(str) {
      const d = document.createElement('div');
      d.textContent = str;
      return d.innerHTML;
    }
    function el(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    }

    const events = JSON.parse(document.getElementById('timeline-data').textContent);
    const meta = el('p', 'meta');
    meta.textContent = events.length + ' event' + (events.length !== 1 ? 's' : '') + ' \\u00B7 Printed from Timeliner';
    document.querySelector('h1').after(meta);

    const groups = {};
    events.sort((a, b) => {
      const ay = a.dateStart ? parseInt(a.dateStart.slice(0,4),10) : Infinity;
      const by = b.dateStart ? parseInt(b.dateStart.slice(0,4),10) : Infinity;
      return ay - by;
    });
    events.forEach(e => {
      const year = e.dateStart ? e.dateStart.slice(0,4) : 'Unknown';
      if (!groups[year]) groups[year] = [];
      groups[year].push(e);
    });
    const container = document.getElementById('timeline');
    Object.entries(groups).sort(([a],[b]) => a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a - b).forEach(([year, evts]) => {
      container.appendChild(el('div', 'year', year));
      evts.forEach(e => {
        const div = el('div', 'event');
        div.appendChild(el('div', 'event-date', e.dateRaw || e.dateStart || 'Unknown'));
        div.appendChild(el('div', 'event-title', e.title));
        if (e.description) div.appendChild(el('div', 'event-desc', e.description));
        if (e.flagged) div.appendChild(el('div', 'flagged', '\\u26A0 ' + (e.flagReason || 'Flagged')));
        const badges = document.createDocumentFragment();
        let hasBadges = false;
        (e.people || []).forEach(p => { hasBadges = true; badges.appendChild(el('span', 'badge badge-person', p)); });
        (e.tags || []).forEach(t => { hasBadges = true; badges.appendChild(el('span', 'badge badge-tag', t)); });
        if (hasBadges) { const bd = el('div', 'badges'); bd.appendChild(badges); div.appendChild(bd); }
        container.appendChild(div);
      });
    });
    window.onload = () => { window.print(); };
  </script>
  <script id="timeline-data" type="application/json"></script>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(html)
  // Safely inject event data via textContent (no innerHTML XSS)
  const dataEl = printWindow.document.getElementById('timeline-data')
  if (dataEl) dataEl.textContent = JSON.stringify(events)
  printWindow.document.close()
}

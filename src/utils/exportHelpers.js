import { saveAs } from 'file-saver'
import Papa from 'papaparse'

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

export function exportHTML(events) {
  const eventsJSON = JSON.stringify(events, null, 2)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timeliner Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #3F3F46; background: #FAFAFA; line-height: 1.5; padding: 2rem; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 1.5rem; font-weight: 600; color: #18181B; margin-bottom: 0.5rem; }
    .meta { font-size: 0.875rem; color: #71717A; margin-bottom: 2rem; }
    .year { font-size: 1.125rem; font-weight: 600; color: #18181B; margin: 1.5rem 0 0.5rem; }
    .event { border: 1px solid #E4E4E7; background: white; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; }
    .event-date { font-size: 0.75rem; color: #71717A; }
    .event-title { font-size: 0.875rem; font-weight: 600; color: #18181B; margin: 0.25rem 0; }
    .event-desc { font-size: 0.875rem; color: #71717A; }
    .badge { display: inline-block; font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; margin-right: 0.25rem; margin-top: 0.375rem; }
    .badge-person { background: #DBEAFE; color: #2563EB; }
    .badge-tag { background: #F4F4F5; color: #3F3F46; }
    .flagged { color: #F59E0B; font-size: 0.75rem; }
  </style>
</head>
<body>
  <h1>Timeline</h1>
  <p class="meta">${events.length} event${events.length !== 1 ? 's' : ''} &middot; Exported from Timeliner</p>
  <div id="timeline"></div>
  <script>
    const events = ${eventsJSON};
    const groups = {};
    events.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));
    events.forEach(e => {
      const year = e.dateStart ? new Date(e.dateStart).getFullYear() : 'Unknown';
      if (!groups[year]) groups[year] = [];
      groups[year].push(e);
    });
    const container = document.getElementById('timeline');
    Object.entries(groups).sort(([a],[b]) => a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a - b).forEach(([year, evts]) => {
      const h = document.createElement('div');
      h.className = 'year';
      h.textContent = year;
      container.appendChild(h);
      evts.forEach(e => {
        let html = '<div class="event-date">' + (e.dateRaw || e.dateStart || 'Unknown') + '</div>';
        html += '<div class="event-title">' + e.title + '</div>';
        if (e.description) html += '<div class="event-desc">' + e.description + '</div>';
        if (e.flagged) html += '<div class="flagged">&#9888; ' + (e.flagReason || 'Flagged') + '</div>';
        (e.people || []).forEach(p => { html += '<span class="badge badge-person">' + p + '</span>'; });
        (e.tags || []).forEach(t => { html += '<span class="badge badge-tag">' + t + '</span>'; });
        const div = document.createElement('div');
        div.className = 'event';
        div.innerHTML = html;
        container.appendChild(div);
      });
    });
  </script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  saveAs(blob, 'timeliner-export.html')
}

export function printTimeline(events) {
  const eventsJSON = JSON.stringify(events, null, 2)

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
  <p class="meta">${events.length} event${events.length !== 1 ? 's' : ''} &middot; Printed from Timeliner</p>
  <div id="timeline"></div>
  <script>
    const events = ${eventsJSON};
    const groups = {};
    events.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));
    events.forEach(e => {
      const year = e.dateStart ? new Date(e.dateStart).getFullYear() : 'Unknown';
      if (!groups[year]) groups[year] = [];
      groups[year].push(e);
    });
    const container = document.getElementById('timeline');
    Object.entries(groups).sort(([a],[b]) => a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a - b).forEach(([year, evts]) => {
      const h = document.createElement('div');
      h.className = 'year';
      h.textContent = year;
      container.appendChild(h);
      evts.forEach(e => {
        let html = '<div class="event-date">' + (e.dateRaw || e.dateStart || 'Unknown') + '</div>';
        html += '<div class="event-title">' + e.title + '</div>';
        if (e.description) html += '<div class="event-desc">' + e.description + '</div>';
        if (e.flagged) html += '<div class="flagged">&#9888; ' + (e.flagReason || 'Flagged') + '</div>';
        let badges = '';
        (e.people || []).forEach(p => { badges += '<span class="badge badge-person">' + p + '</span>'; });
        (e.tags || []).forEach(t => { badges += '<span class="badge badge-tag">' + t + '</span>'; });
        if (badges) html += '<div class="badges">' + badges + '</div>';
        const div = document.createElement('div');
        div.className = 'event';
        div.innerHTML = html;
        container.appendChild(div);
      });
    });
    window.onload = () => { window.print(); };
  </script>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

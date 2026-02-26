import { FileCode, FileJson, FileSpreadsheet, Link2 } from 'lucide-react';
import { buildStandaloneHtml } from '../lib/exportHtml';
import { timelineToCsv } from '../lib/exportCsv';

function download(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportBar({ data, shareLink, tooLarge }) {
  return (
    <div className="export-bar">
      <button
        disabled={tooLarge}
        onClick={async () => {
          await navigator.clipboard.writeText(shareLink);
          alert('Copied link');
        }}
      >
        <Link2 size={14} /> Copy Link
      </button>
      {tooLarge && <span className="warning">Share payload too large for URL. Use HTML export.</span>}
      <button onClick={() => download('timeliner.html', buildStandaloneHtml({ data, includePhotos: true }), 'text/html')}>
        <FileCode size={14} /> Download HTML
      </button>
      <button onClick={() => download('timeliner.json', JSON.stringify(data, null, 2), 'application/json')}>
        <FileJson size={14} /> Download JSON
      </button>
      <button onClick={() => download('timeliner.csv', timelineToCsv(data), 'text/csv')}>
        <FileSpreadsheet size={14} /> Download CSV
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import ExportBar from './components/ExportBar';
import FilterBar from './components/FilterBar';
import GridView from './components/GridView';
import HorizontalTimeline from './components/HorizontalTimeline';
import InputPanel from './components/InputPanel';
import ReviewQueue from './components/ReviewQueue';
import VerticalTimeline from './components/VerticalTimeline';
import ViewToggle from './components/ViewToggle';
import { useTimelineData } from './hooks/useTimelineData';
import { readShareFromHash, useShareLink } from './hooks/useShareLink';
import { addDateHintsToPhotos } from './lib/dateParse';
import { parseTimelineFromText } from './lib/parseClient';
import { timelineDataSchema } from './lib/schema';

const emptyData = { items: [], detected_people: [], version: '1.0.0' };

function ErrorBoundary({ children }) {
  const [error, setError] = useState(null);
  useEffect(() => {
    const handler = (e) => setError(e.error || new Error('Unknown app error'));
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);
  if (error) return <div className="error">Something went wrong. Refresh to retry.</div>;
  return children;
}

export default function App() {
  const shared = readShareFromHash();
  const initialState = shared?.data || { timeline: emptyData, view: 'vertical', filters: { search: '', people: [], tag: '', density: 'expanded' } };
  const [view, setView] = useState(initialState.view);
  const [loadError, setLoadError] = useState(shared?.error || '');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const { data, setData, filters, setFilters, filteredItems } = useTimelineData(initialState.timeline);

  useEffect(() => {
    const cached = localStorage.getItem('timeliner:lastState');
    if (!cached) return;
    const parsed = timelineDataSchema.safeParse(JSON.parse(cached));
    if (parsed.success && data.items.length === 0) setData(parsed.data);
  }, []);

  useEffect(() => {
    localStorage.setItem('timeliner:lastState', JSON.stringify(data));
    window.location.hash = view;
  }, [data, view]);

  const peopleOptions = useMemo(() => Array.from(new Set(data.items.flatMap((i) => i.people).concat(data.detected_people))), [data]);
  const tagOptions = useMemo(() => Array.from(new Set(data.items.flatMap((i) => i.tags))), [data]);

  const sharePayload = { timeline: data, view, filters };
  const { link, tooLarge } = useShareLink(sharePayload);

  async function handleParse({ text, photos }) {
    setLoading(true);
    setApiError('');
    try {
      const photoFilenames = addDateHintsToPhotos(photos).map((p) => p.filename);
      const parsed = await parseTimelineFromText({ text, photoFilenames });

      const photoMap = new Map();
      await Promise.all(
        photos.map(
          (file) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                photoMap.set(file.name, reader.result);
                resolve();
              };
              reader.readAsDataURL(file);
            })
        )
      );

      parsed.items = parsed.items.map((item) => ({
        ...item,
        photo_refs: item.photo_refs.map((ref) => ({ ...ref, dataURL: photoMap.get(ref.filename) })),
      }));
      setData(parsed);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const reviewItems = filteredItems.filter((i) => i.needs_review);

  return (
    <ErrorBoundary>
      <main className="app">
        <h1>Timeliner</h1>
        {loadError && (
          <div className="error">
            {loadError} <button onClick={() => { window.location.hash = ''; setLoadError(''); }}>Reset</button>
          </div>
        )}
        <InputPanel onParse={handleParse} loading={loading} />
        {apiError && <div className="error">{apiError}</div>}

        <section>
          <ViewToggle view={view} onChange={setView} />
          <label>
            Density
            <select value={filters.density} onChange={(e) => setFilters((f) => ({ ...f, density: e.target.value }))}>
              <option value="compact">Compact</option>
              <option value="expanded">Expanded</option>
            </select>
          </label>
          <FilterBar filters={filters} setFilters={setFilters} peopleOptions={peopleOptions} tagOptions={tagOptions} />

          {filteredItems.length === 0 ? (
            <p className="empty">No timeline items yet. Paste text and click Parse.</p>
          ) : view === 'horizontal' ? (
            <HorizontalTimeline items={filteredItems} />
          ) : view === 'grid' ? (
            <GridView items={filteredItems} />
          ) : (
            <VerticalTimeline items={filteredItems} density={filters.density} />
          )}
        </section>

        <ReviewQueue
          items={reviewItems}
          onSave={(updated) =>
            setData((current) => ({
              ...current,
              items: current.items.map((item) => (item.id === updated.id ? { ...updated, needs_review: false } : item)),
            }))
          }
        />
        <ExportBar data={data} shareLink={link} tooLarge={tooLarge} />
      </main>
    </ErrorBoundary>
  );
}

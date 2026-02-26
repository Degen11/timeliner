import { useMemo, useState } from 'react';

export default function VerticalTimeline({ items, density }) {
  const grouped = useMemo(() => {
    return items.reduce((acc, item) => {
      const year = item.date.start.slice(0, 4);
      acc[year] = acc[year] || [];
      acc[year].push(item);
      return acc;
    }, {});
  }, [items]);

  const [closed, setClosed] = useState({});

  return (
    <div>
      {Object.entries(grouped).map(([year, yearItems]) => (
        <section key={year}>
          <button className="year-header" onClick={() => setClosed((c) => ({ ...c, [year]: !c[year] }))}>
            {year} ({yearItems.length})
          </button>
          {!closed[year] &&
            yearItems.map((item) => (
              <article className={`item-card ${density}`} key={item.id}>
                <small>{item.date.display}</small>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <div className="chips">{item.people.map((p) => <span key={p} className="chip">{p}</span>)}</div>
                <div className="photos">
                  {item.photo_refs.map((ph) => (
                    <img key={ph.filename} src={ph.dataURL || ''} alt={ph.filename} title={ph.filename} />
                  ))}
                </div>
              </article>
            ))}
        </section>
      ))}
    </div>
  );
}

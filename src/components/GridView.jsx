import { decadeLabel } from '../lib/dateParse';

export default function GridView({ items }) {
  const groups = items.reduce((acc, item) => {
    const label = decadeLabel(item.date.start);
    acc[label] = acc[label] || [];
    acc[label].push(item);
    return acc;
  }, {});

  return Object.entries(groups).map(([decade, group]) => (
    <section key={decade}>
      <h3>{decade}</h3>
      <div className="grid">
        {group.map((item) => (
          <article key={item.id} className="item-card">
            <h4>{item.title}</h4>
            <p>{item.date.display}</p>
            <p>{item.description}</p>
            {item.photo_refs[0] && <img src={item.photo_refs[0].dataURL || ''} alt={item.photo_refs[0].filename} />}
          </article>
        ))}
      </div>
    </section>
  ));
}

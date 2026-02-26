import { Check } from 'lucide-react';

export default function ReviewQueue({ items, onSave }) {
  if (!items.length) return null;

  return (
    <section>
      <h3>Review Queue</h3>
      {items.map((item) => (
        <ReviewRow key={item.id} item={item} onSave={onSave} />
      ))}
    </section>
  );
}

function ReviewRow({ item, onSave }) {
  return (
    <div className="review-row">
      <strong>{item.title}</strong>
      <small>{item.review_reason}</small>
      <input type="date" defaultValue={item.date.start} onChange={(e) => (item.date.start = e.target.value)} />
      <select defaultValue={item.date.granularity} onChange={(e) => (item.date.granularity = e.target.value)}>
        <option value="day">day</option>
        <option value="month">month</option>
        <option value="year">year</option>
        <option value="approx">approx</option>
      </select>
      <input type="range" min="0" max="1" step="0.05" defaultValue={item.date.confidence} onChange={(e) => (item.date.confidence = Number(e.target.value))} />
      <button onClick={() => onSave(item)}>
        <Check size={14} /> Save
      </button>
    </div>
  );
}

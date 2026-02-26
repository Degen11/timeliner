import { useMemo, useState } from 'react';

export default function HorizontalTimeline({ items }) {
  const years = items.map((i) => Number(i.date.start.slice(0, 4)));
  const min = Math.min(...years, new Date().getFullYear() - 20);
  const max = Math.max(...years, new Date().getFullYear());
  const [windowYears, setWindowYears] = useState(Math.min(40, max - min + 1));
  const [hovered, setHovered] = useState(null);

  const visible = useMemo(() => items.filter((i) => Number(i.date.start.slice(0, 4)) <= min + windowYears), [items, min, windowYears]);

  return (
    <div>
      <label>
        Window years: {windowYears}
        <input type="range" min="5" max={Math.max(10, max - min + 1)} value={windowYears} onChange={(e) => setWindowYears(Number(e.target.value))} />
      </label>
      <svg viewBox="0 0 900 200" role="img" aria-label="Horizontal timeline">
        <line x1="50" y1="100" x2="850" y2="100" stroke="currentColor" />
        {Array.from({ length: Math.ceil((max - min) / 10) + 1 }).map((_, idx) => {
          const y = min + idx * 10;
          const x = 50 + ((y - min) / (Math.max(windowYears, 1))) * 780;
          return (
            <g key={y}>
              <line x1={x} y1="90" x2={x} y2="110" stroke="gray" />
              <text x={x} y="125" fontSize="10" textAnchor="middle">
                {y}
              </text>
            </g>
          );
        })}
        {visible.map((item, idx) => {
          const y = Number(item.date.start.slice(0, 4));
          const x = 50 + ((y - min) / Math.max(windowYears, 1)) * 780;
          return (
            <g key={item.id}>
              <circle
                cx={x}
                cy={100 - (idx % 3) * 12}
                r="6"
                tabIndex="0"
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(item.id)}
                onBlur={() => setHovered(null)}
              />
            </g>
          );
        })}
      </svg>
      {hovered && <div className="tooltip">{items.find((i) => i.id === hovered)?.title}</div>}
    </div>
  );
}

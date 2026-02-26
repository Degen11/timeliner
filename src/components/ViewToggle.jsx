import { Grid3X3, LayoutPanelLeft, List } from 'lucide-react';

const options = [
  { key: 'vertical', icon: List, label: 'Vertical' },
  { key: 'horizontal', icon: LayoutPanelLeft, label: 'Horizontal' },
  { key: 'grid', icon: Grid3X3, label: 'Grid' },
];

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle">
      {options.map(({ key, icon: Icon, label }) => (
        <button key={key} className={view === key ? 'active' : ''} onClick={() => onChange(key)}>
          <Icon size={16} /> {label}
        </button>
      ))}
    </div>
  );
}

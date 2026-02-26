import { PlusCircle, Sparkles, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

const defaults = ['Parent A', 'Parent B', 'Me'];

export default function InputPanel({ onParse, loading }) {
  const [text, setText] = useState('');
  const [people, setPeople] = useState(defaults);
  const [photos, setPhotos] = useState([]);
  const inputRef = useRef(null);

  const addPerson = () => {
    const value = prompt('Add person');
    if (value) setPeople((p) => [...p, value]);
  };

  return (
    <section>
      <h2>Input</h2>
      <textarea
        rows={7}
        value={text}
        placeholder="Paste life events, notes, journals, etc."
        onPaste={() => {}}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => setText('Aug 1965: Parent A moved to Austin. 1968: Started first job. 1972-06-15 married Parent B.')}>Example input</button>
      <div className="chips">
        {people.map((person) => (
          <span className="chip" key={person}>
            {person}{' '}
            <button onClick={() => setPeople((p) => p.filter((x) => x !== person))}>
              <X size={12} />
            </button>
          </span>
        ))}
        <button onClick={addPerson}>
          <PlusCircle size={14} /> Add person
        </button>
      </div>
      <label className="upload" onDrop={(e) => { e.preventDefault(); setPhotos((p) => [...p, ...Array.from(e.dataTransfer.files)]); }} onDragOver={(e) => e.preventDefault()}>
        <Upload size={16} /> Drag/drop photos
        <input ref={inputRef} type="file" multiple accept="image/*" onChange={(e) => setPhotos((p) => [...p, ...Array.from(e.target.files || [])])} hidden />
      </label>
      <div className="photos">{photos.map((photo) => <span key={photo.name}>{photo.name}</span>)}</div>
      <button disabled={loading || !text.trim()} onClick={() => onParse({ text, photos, people })}>
        <Sparkles size={14} /> {loading ? 'Parsing...' : 'Parse'}
      </button>
    </section>
  );
}

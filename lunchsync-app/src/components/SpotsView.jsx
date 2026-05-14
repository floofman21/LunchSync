import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { isPast } from '../data.js';

export default function SpotsView({ restaurants, lunches, addRestaurant, removeRestaurant }) {
  const [draft, setDraft] = useState('');

  const visitCounts = useMemo(() => {
    const counts = {};
    lunches.forEach(l => {
      if (l.restaurant && isPast(l.date)) {
        counts[l.restaurant] = (counts[l.restaurant] || 0) + 1;
      }
    });
    return counts;
  }, [lunches]);

  const onAdd = () => {
    if (!draft.trim()) return;
    addRestaurant(draft);
    setDraft('');
  };

  return (
    <div>
      <div className="section-label">the rotation · {restaurants.length} spots</div>
      <div className="hint" style={{ marginBottom: '1.2rem' }}>
        places within 15 minutes — vote for them on the upcoming lunch
      </div>

      <div className="add-row">
        <input
          className="add-input"
          placeholder="add a new spot…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
        />
        <button className="add-btn" onClick={onAdd}>
          <Plus size={14}/> add
        </button>
      </div>

      <div className="spot-list">
        {restaurants.map(r => (
          <div key={r.name} className="spot-row">
            <div className="spot-row-main">
              <div className="spot-name">{r.name}</div>
              <div className="spot-meta">
                {visitCounts[r.name] ? `visited ${visitCounts[r.name]}×` : 'never tried'}
                {r.addedBy !== 'system' && ` · added by ${r.addedBy}`}
              </div>
            </div>
            <button
              className="spot-remove"
              onClick={() => { if (confirm(`Remove ${r.name}?`)) removeRestaurant(r.name); }}
              title="remove"
            >
              <Trash2 size={14}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

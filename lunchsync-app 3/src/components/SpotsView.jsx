import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { isPast } from '../data.js';

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'dairy-free', 'nut-free'];

const RATING_EMOJI = { fire: '🔥', meh: '😐', never: '❌' };

function getRatingSummary(restaurantName, lunches, ratings) {
  const visitIds = lunches
    .filter(l => l.restaurant === restaurantName && isPast(l.date))
    .map(l => l.id);
  const all = visitIds.flatMap(id => Object.values((ratings || {})[id] || {}));
  if (!all.length) return null;
  const counts = { fire: 0, meh: 0, never: 0 };
  all.forEach(r => { if (counts[r] !== undefined) counts[r]++; });
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${RATING_EMOJI[k]}×${n}`)
    .join(' ');
}

function getCompatLabel(restaurantName, nextLunchYes, dietary, restaurantTags) {
  if (!nextLunchYes.length || !Object.keys(dietary).length) return null;
  const rTags = (restaurantTags || {})[restaurantName] || [];
  const conflicts = nextLunchYes.filter(n => (dietary[n] || []).some(r => !rTags.includes(r)));
  if (conflicts.length === 0) return { ok: true, label: '✓ all good' };
  return { ok: false, label: `⚠️ ${conflicts.join(', ')}` };
}

function SpotRow({ r, nextLunchYes, visitCounts, ratings, lunches, dietary, restaurantTags, tagRestaurant, onRemove }) {
  const [editingTags, setEditingTags] = useState(false);
  const visits = visitCounts[r.name] || 0;
  const ratingSummary = useMemo(() => getRatingSummary(r.name, lunches, ratings), [r.name, lunches, ratings]);
  const compat = useMemo(() => getCompatLabel(r.name, nextLunchYes, dietary, restaurantTags), [r.name, nextLunchYes, dietary, restaurantTags]);
  const tags = (restaurantTags || {})[r.name] || [];

  const toggleTag = (tag) => {
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    tagRestaurant(r.name, next);
  };

  return (
    <div className={`spot-row-wrapper ${editingTags ? 'expanded' : ''}`}>
      <div className="spot-row">
        <div className="spot-row-main">
          <div className="spot-name">{r.name}</div>
          <div className="spot-meta">
            {visits ? `${visits} visit${visits !== 1 ? 's' : ''}` : 'untouched'}
            {r.addedBy !== 'system' && ` · added by ${r.addedBy}`}
            {ratingSummary && <span className="spot-rating-badge">&nbsp;· {ratingSummary}</span>}
          </div>
          {(tags.length > 0 || compat) && (
            <div className="spot-tag-row">
              {tags.map(t => <span key={t} className="spot-tag-pill">{t}</span>)}
              {compat && (
                <span className={`spot-compat-badge ${compat.ok ? 'ok' : 'warn'}`}>{compat.label}</span>
              )}
            </div>
          )}
        </div>
        <div className="spot-actions">
          <button
            className={`spot-tag-btn ${editingTags ? 'active' : ''}`}
            onClick={() => setEditingTags(e => !e)}
            title="dietary tags"
          >
            <Tag size={13} />
          </button>
          <button
            className="spot-remove"
            onClick={() => { if (confirm(`Remove ${r.name}?`)) onRemove(r.name); }}
            title="remove"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {editingTags && (
        <div className="spot-tag-editor">
          <span className="spot-tag-hint">tag what this place accommodates:</span>
          <div className="spot-tag-options">
            {DIETARY_OPTIONS.map(tag => (
              <button
                key={tag}
                className={`spot-tag-toggle ${tags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpotsView({ restaurants, lunches, addRestaurant, removeRestaurant, ratings, dietary, restaurantTags, tagRestaurant }) {
  const [draft, setDraft] = useState('');

  const visitCounts = useMemo(() => {
    const counts = {};
    lunches.forEach(l => {
      if (l.restaurant && isPast(l.date)) counts[l.restaurant] = (counts[l.restaurant] || 0) + 1;
    });
    return counts;
  }, [lunches]);

  const nextLunch = lunches.find(l => !isPast(l.date));
  const nextLunchYes = nextLunch ? Object.entries(nextLunch.rsvps).filter(([, v]) => v === 'yes').map(([k]) => k) : [];

  const onAdd = () => {
    if (!draft.trim()) return;
    addRestaurant(draft);
    setDraft('');
  };

  return (
    <div>
      <div className="section-label">the rotation</div>
      <div className="hint" style={{ marginBottom: '1.2rem' }}>
        {restaurants.length} places on the list · tag dietary accommodations · ratings from past visits
      </div>

      <div className="add-row">
        <input
          className="add-input"
          placeholder="found a new spot? add it here…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
        />
        <button className="add-btn" onClick={onAdd}><Plus size={14} /> add it</button>
      </div>

      <div className="spot-list">
        {restaurants.map(r => (
          <SpotRow
            key={r.name}
            r={r}
            nextLunchYes={nextLunchYes}
            visitCounts={visitCounts}
            ratings={ratings}
            lunches={lunches}
            dietary={dietary}
            restaurantTags={restaurantTags}
            tagRestaurant={tagRestaurant}
            onRemove={removeRestaurant}
          />
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { Calendar, MapPin, Clock, Sparkles } from 'lucide-react';
import { isPast, daysUntil } from '../data.js';

export default function Nav({ view, setView, lunches }) {
  const nextLunch = lunches.find(l => !isPast(l.date));
  const items = [
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'spots', label: 'Spots', icon: MapPin },
    { id: 'history', label: 'History', icon: Clock }
  ];
  return (
    <nav className="nav">
      {items.map(it => {
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            className={`nav-item ${view === it.id ? 'active' : ''}`}
            onClick={() => setView(it.id)}
          >
            <Icon size={16}/>
            <span>{it.label}</span>
          </button>
        );
      })}
      {nextLunch && (
        <div className="nav-spacer">
          <div className="next-pill">
            <Sparkles size={12}/>
            <span>next: {daysUntil(nextLunch.date) === 0 ? 'today' : `in ${daysUntil(nextLunch.date)}d`}</span>
          </div>
        </div>
      )}
    </nav>
  );
}

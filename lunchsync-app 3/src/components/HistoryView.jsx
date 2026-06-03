import React from 'react';
import { fmtDate, isPast } from '../data.js';

const RATINGS = [
  { key: 'fire',  emoji: '🔥', label: 'loved it' },
  { key: 'meh',   emoji: '😐', label: 'it was ok' },
  { key: 'never', emoji: '❌', label: 'never again' },
];

export default function HistoryView({ lunches, me, ratings, setRating }) {
  const past = lunches.filter(l => isPast(l.date)).reverse();
  if (past.length === 0) {
    return <div className="empty">no past lunches yet — the first one's coming up.</div>;
  }
  return (
    <div>
      <div className="section-label">the archives</div>
      <div className="history-list">
        {past.map(l => {
          const attendees = Object.entries(l.rsvps).filter(([, s]) => s === 'yes').map(([n]) => n);
          const yesCount = attendees.length;
          const lunchRatings = (ratings || {})[l.id] || {};
          const myRating = lunchRatings[me];
          const counts = { fire: 0, meh: 0, never: 0 };
          Object.values(lunchRatings).forEach(r => { if (counts[r] !== undefined) counts[r]++; });
          const totalRated = counts.fire + counts.meh + counts.never;

          return (
            <div key={l.id} className="history-item">
              <div className="history-row">
                <div className="history-date">{fmtDate(l.date)}</div>
                <div className="history-where">{l.restaurant || <em>no spot picked</em>}</div>
                <div className="history-who">
                  {attendees.length > 0 ? attendees.join(', ') : 'ghost town'}
                  <span className="history-count">{yesCount}</span>
                </div>
              </div>
              {l.restaurant && (
                <div className="history-rating">
                  <div className="rating-summary">
                    {totalRated > 0
                      ? RATINGS.filter(r => counts[r.key] > 0).map(r => (
                          <span key={r.key} className="rating-tally">{r.emoji} {counts[r.key]}</span>
                        ))
                      : <span className="rating-none">no ratings yet</span>
                    }
                  </div>
                  <div className="rating-btns">
                    {RATINGS.map(r => (
                      <button
                        key={r.key}
                        className={`rating-btn ${myRating === r.key ? 'active' : ''}`}
                        onClick={() => setRating(l.id, myRating === r.key ? null : r.key)}
                        title={r.label}
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

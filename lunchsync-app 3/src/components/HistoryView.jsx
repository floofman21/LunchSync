import React from 'react';
import { fmtDate, isPast } from '../data.js';

const RATINGS = [
  { key: 'fire',  emoji: '🔥', label: 'loved it' },
  { key: 'meh',   emoji: '😐', label: 'it was ok' },
  { key: 'never', emoji: '❌', label: 'never again' },
];

export default function HistoryView({ lunches, me, teams, ratings, setRating, setView }) {
  const myTeams = (teams || []).filter(t => t.members.includes(me));

  if (myTeams.length === 0) {
    return (
      <div className="onboarding-card">
        <div className="onboarding-emoji">📖</div>
        <h2 className="onboarding-title">no history yet</h2>
        <p className="onboarding-body">
          Join or create a team to start tracking your group's lunch history.
        </p>
        <button className="onboarding-btn" onClick={() => setView('profile')}>
          set up my team →
        </button>
      </div>
    );
  }

  const teammates = new Set(myTeams.flatMap(t => t.members));

  // Only show past lunches where at least one teammate attended
  const past = lunches
    .filter(l => isPast(l.date))
    .filter(l => Object.entries(l.rsvps).some(([n, s]) => s === 'yes' && teammates.has(n)))
    .reverse();

  if (past.length === 0) {
    return <div className="empty">no past lunches yet — the first one's coming up.</div>;
  }

  return (
    <div>
      <div className="section-label">the archives</div>
      <div className="history-list">
        {past.map(l => {
          // Only list teammates who attended
          const attendees = Object.entries(l.rsvps)
            .filter(([n, s]) => s === 'yes' && teammates.has(n))
            .map(([n]) => n);
          const lunchRatings = (ratings || {})[l.id] || {};
          const myRating = lunchRatings[me];
          // Tally only teammates' ratings
          const counts = { fire: 0, meh: 0, never: 0 };
          Object.entries(lunchRatings).forEach(([n, r]) => {
            if (teammates.has(n) && counts[r] !== undefined) counts[r]++;
          });
          const totalRated = counts.fire + counts.meh + counts.never;

          return (
            <div key={l.id} className="history-item">
              <div className="history-row">
                <div className="history-date">{fmtDate(l.date)}</div>
                <div className="history-where">{l.restaurant || <em>no spot picked</em>}</div>
                <div className="history-who">
                  {attendees.length > 0 ? attendees.join(', ') : 'ghost town'}
                  <span className="history-count">{attendees.length}</span>
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

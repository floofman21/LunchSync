import React from 'react';
import { TEAM, fmtDate, isPast } from '../data.js';

export default function HistoryView({ lunches }) {
  const past = lunches.filter(l => isPast(l.date)).reverse();
  if (past.length === 0) {
    return <div className="empty">no past lunches yet — the first one's coming up.</div>;
  }
  return (
    <div>
      <div className="section-label">the archives</div>
      <div className="history-list">
        {past.map(l => {
          const yesCount = Object.values(l.rsvps).filter(s => s === 'yes').length;
          const attendees = TEAM.filter(n => l.rsvps[n] === 'yes');
          return (
            <div key={l.id} className="history-row">
              <div className="history-date">{fmtDate(l.date)}</div>
              <div className="history-where">{l.restaurant || <em>no spot picked</em>}</div>
              <div className="history-who">
                {attendees.length > 0 ? attendees.join(', ') : 'ghost town'}
                <span className="history-count">{yesCount}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

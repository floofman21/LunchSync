import React, { useState } from 'react';
import { Check, X, HelpCircle, MapPin } from 'lucide-react';
import { TEAM, fmtDate, fmtDateLong, isPast, isToday, daysUntil } from '../data.js';

export default function UpcomingView({ lunches, me, restaurants, setRsvp, setRestaurant, toggleProposal, setNotes }) {
  const upcoming = lunches.filter(l => !isPast(l.date));
  if (upcoming.length === 0) {
    return <div className="empty">no lunches on the calendar — head to <strong>Spots</strong> to add some.</div>;
  }
  const [next, ...rest] = upcoming;
  return (
    <div>
      <NextLunchCard
        lunch={next}
        me={me}
        restaurants={restaurants}
        setRsvp={setRsvp}
        setRestaurant={setRestaurant}
        toggleProposal={toggleProposal}
        setNotes={setNotes}
      />
      {rest.length > 0 && (
        <div className="future">
          <div className="section-label">what's coming up</div>
          <div className="future-grid">
            {rest.slice(0, 8).map(l => (
              <FutureCard key={l.id} lunch={l} me={me} setRsvp={setRsvp}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NextLunchCard({ lunch, me, restaurants, setRsvp, setRestaurant, toggleProposal, setNotes }) {
  const myRsvp = lunch.rsvps[me];
  const yesCount = Object.values(lunch.rsvps).filter(s => s === 'yes').length;
  const noCount = Object.values(lunch.rsvps).filter(s => s === 'no').length;
  const maybeCount = Object.values(lunch.rsvps).filter(s => s === 'maybe').length;
  const pending = TEAM.filter(n => !lunch.rsvps[n]);
  const d = daysUntil(lunch.date);
  const [showAllSpots, setShowAllSpots] = useState(false);
  const proposalEntries = Object.entries(lunch.proposedRestaurants).sort((a, b) => b[1].length - a[1].length);
  const visibleRestaurants = showAllSpots ? restaurants : restaurants.slice(0, 6);

  return (
    <article className="card-hero">
      <div className="hero-tag">
        {isToday(lunch.date) ? 'today' : d === 1 ? 'tomorrow' : d < 0 ? 'happening now' : `in ${d} days`}
      </div>
      <h2 className="hero-date">{fmtDateLong(lunch.date)}</h2>
      <div className="hero-time">@ {lunch.time}</div>

      <div className="block">
        <div className="block-label">your RSVP</div>
        <div className="rsvp-row">
          <RsvpBtn status="yes" active={myRsvp === 'yes'} onClick={() => setRsvp(lunch.id, 'yes')} icon={Check} label="in"/>
          <RsvpBtn status="maybe" active={myRsvp === 'maybe'} onClick={() => setRsvp(lunch.id, 'maybe')} icon={HelpCircle} label="maybe"/>
          <RsvpBtn status="no" active={myRsvp === 'no'} onClick={() => setRsvp(lunch.id, 'no')} icon={X} label="out"/>
        </div>
        <div className="rsvp-stats">
          <span className="stat-yes">{yesCount} in</span>
          {maybeCount > 0 && <span className="stat-maybe">{maybeCount} maybe</span>}
          {noCount > 0 && <span className="stat-no">{noCount} out</span>}
          {pending.length > 0 && <span className="stat-pending">{pending.length} haven't replied</span>}
        </div>
        <div className="rsvp-people">
          {TEAM.map(n => {
            const s = lunch.rsvps[n];
            return (
              <div key={n} className={`person person-${s || 'pending'}`}>
                <span>{n}</span>
                {s === 'yes' && <Check size={11}/>}
                {s === 'no' && <X size={11}/>}
                {s === 'maybe' && <HelpCircle size={11}/>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="block">
        <div className="block-label">where</div>
        {lunch.restaurant ? (
          <div className="picked-row">
            <div className="picked">
              <MapPin size={16}/>
              <strong>{lunch.restaurant}</strong>
            </div>
            <button className="link-btn" onClick={() => setRestaurant(lunch.id, null)}>change</button>
          </div>
        ) : (
          <>
            <div className="hint">nothing picked yet! vote for somewhere or just lock one in →</div>
            {proposalEntries.length > 0 && (
              <div className="proposals">
                {proposalEntries.map(([name, voters]) => (
                  <div key={name}>
                    <button className="proposal-name-btn" onClick={() => setRestaurant(lunch.id, name)} title="lock this one in">
                      <span>{name}</span>
                      <span className="proposal-votes">{voters.length} {voters.length === 1 ? 'vote' : 'votes'}</span>
                    </button>
                    <div className="proposal-voters">{voters.join(', ')}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="spot-grid">
              {visibleRestaurants.map(r => {
                const voters = lunch.proposedRestaurants[r.name] || [];
                const iVoted = voters.includes(me);
                return (
                  <button
                    key={r.name}
                    className={`spot-chip ${iVoted ? 'voted' : ''}`}
                    onClick={() => toggleProposal(lunch.id, r.name)}
                  >
                    {iVoted && <Check size={11}/>}
                    <span>{r.name}</span>
                  </button>
                );
              })}
              {restaurants.length > 6 && (
                <button className="spot-chip more" onClick={() => setShowAllSpots(s => !s)}>
                  {showAllSpots ? 'fewer' : `+${restaurants.length - 6} more`}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="block">
        <div className="block-label">notes</div>
        <textarea
          className="notes"
          placeholder="anything to share? reservation? guests? dietary chaos?"
          value={lunch.notes || ''}
          onChange={e => setNotes(lunch.id, e.target.value)}
          rows={2}
        />
      </div>
    </article>
  );
}

function RsvpBtn({ status, active, onClick, icon: Icon, label }) {
  return (
    <button className={`rsvp-btn rsvp-${status} ${active ? 'active' : ''}`} onClick={onClick}>
      <Icon size={18}/>
      <span>{label}</span>
    </button>
  );
}

function FutureCard({ lunch, me, setRsvp }) {
  const myRsvp = lunch.rsvps[me];
  const yesCount = Object.values(lunch.rsvps).filter(s => s === 'yes').length;
  return (
    <div className="future-card">
      <div className="future-date">{fmtDate(lunch.date)}</div>
      <div className="future-where">{lunch.restaurant || <em>tbd</em>}</div>
      <div className="future-yes">{yesCount > 0 ? `${yesCount} ${yesCount === 1 ? 'pear' : 'pears'} in` : 'crickets so far'}</div>
      <div className="future-rsvp">
        <button className={`mini-rsvp ${myRsvp === 'yes' ? 'on yes' : ''}`} onClick={() => setRsvp(lunch.id, 'yes')} title="in"><Check size={12}/></button>
        <button className={`mini-rsvp ${myRsvp === 'maybe' ? 'on maybe' : ''}`} onClick={() => setRsvp(lunch.id, 'maybe')} title="maybe"><HelpCircle size={12}/></button>
        <button className={`mini-rsvp ${myRsvp === 'no' ? 'on no' : ''}`} onClick={() => setRsvp(lunch.id, 'no')} title="out"><X size={12}/></button>
      </div>
    </div>
  );
}

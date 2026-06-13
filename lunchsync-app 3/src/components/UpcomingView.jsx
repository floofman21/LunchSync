import React, { useState, useRef, useEffect } from 'react';
import { Check, X, HelpCircle, MapPin, Plus, Trash2 } from 'lucide-react';
import { fmtDate, fmtDateLong, isPast, isToday, daysUntil } from '../data.js';

const VIBES = ['quick bite', 'sit-down', 'adventurous', 'comfort food', 'patio'];

const VIBE_EMOJI = {
  'quick bite': '⚡',
  'sit-down': '🍽️',
  'adventurous': '🗺️',
  'comfort food': '🫶',
  'patio': '☀️',
};

function getNextPicker(allLunches, yesAttendees) {
  if (!yesAttendees.length) return null;
  const counts = Object.fromEntries(yesAttendees.map(n => [n, 0]));
  const lastIdx = Object.fromEntries(yesAttendees.map(n => [n, -1]));
  allLunches
    .filter(l => l.lockedBy && l.restaurant && isPast(l.date))
    .forEach((l, i) => {
      if (counts[l.lockedBy] !== undefined) {
        counts[l.lockedBy]++;
        lastIdx[l.lockedBy] = i;
      }
    });
  return [...yesAttendees].sort((a, b) =>
    counts[a] !== counts[b] ? counts[a] - counts[b] : lastIdx[a] - lastIdx[b]
  )[0];
}

function SpinWheel({ attendees }) {
  const [phase, setPhase] = useState('idle');
  const [shown, setShown] = useState('');
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const spin = () => {
    if (phase === 'spinning' || !attendees.length) return;
    setPhase('spinning');
    const winner = attendees[Math.floor(Math.random() * attendees.length)];
    let tick = 0;
    const total = 18 + Math.floor(Math.random() * 8);
    timerRef.current = setInterval(() => {
      setShown(attendees[tick % attendees.length]);
      tick++;
      if (tick >= total) {
        clearInterval(timerRef.current);
        setShown(winner);
        setPhase('done');
      }
    }, 72);
  };

  const reset = () => { setPhase('idle'); setShown(''); };

  return (
    <div className="spin-wrap">
      <button
        className={`spin-btn spin-${phase}`}
        onClick={phase === 'done' ? reset : spin}
        disabled={phase === 'spinning'}
      >
        🎰{' '}
        {phase === 'idle' && 'spin to decide'}
        {phase === 'spinning' && (shown || '…')}
        {phase === 'done' && `${shown}!`}
      </button>
      {phase === 'done' && <span className="spin-hint">tap to reset</span>}
    </div>
  );
}

function AddLunchForm({ onAdd, onCancel }) {
  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('12:15');
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="add-lunch-form">
      <div className="add-lunch-form-label">schedule a lunch</div>
      <div className="add-lunch-fields">
        <input
          type="date"
          className="add-lunch-input"
          value={date}
          min={today}
          onChange={e => setDate(e.target.value)}
        />
        <input
          type="time"
          className="add-lunch-input"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
        <button
          className="add-lunch-btn"
          onClick={() => date && onAdd(date, time)}
          disabled={!date}
        >
          add to calendar
        </button>
        <button className="add-lunch-cancel" onClick={onCancel}>cancel</button>
      </div>
    </div>
  );
}

function AddLunchTrigger({ onAdd }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="add-lunch-wrap">
        <AddLunchForm
          onAdd={(date, time) => { onAdd(date, time); setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="add-lunch-wrap">
      <button className="add-lunch-trigger" onClick={() => setOpen(true)}>
        <Plus size={15} />
        schedule a lunch
      </button>
    </div>
  );
}

export default function UpcomingView({
  lunches, me, teams, restaurants,
  setRsvp, setRestaurant, toggleProposal, setNotes, setVibe,
  dietary, restaurantTags, setView,
  addLunch, removeLunch
}) {
  const [addOpen, setAddOpen] = useState(false);
  const myTeams = (teams || []).filter(t => t.members.includes(me));

  if (myTeams.length === 0) {
    return (
      <div className="onboarding-card">
        <div className="onboarding-emoji">🥪</div>
        <h2 className="onboarding-title">welcome to LunchSync</h2>
        <p className="onboarding-body">
          You're not on a team yet. Create one for your crew or enter a code someone shared with you.
        </p>
        <button className="onboarding-btn" onClick={() => setView('profile')}>
          set up my team →
        </button>
      </div>
    );
  }

  const upcoming = lunches.filter(l => !isPast(l.date));

  if (upcoming.length === 0) {
    return (
      <div>
        <div className="empty-lunches">
          <div className="empty-lunches-emoji">📅</div>
          <div className="empty-lunches-text">no lunches scheduled yet</div>
          <div className="empty-lunches-sub">pick a date and time to get started</div>
        </div>
        <AddLunchTrigger onAdd={addLunch} />
      </div>
    );
  }

  const [next, ...rest] = upcoming;
  return (
    <div>
      <div className="upcoming-top-action">
        {addOpen ? (
          <AddLunchForm
            onAdd={(date, time) => { addLunch(date, time); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        ) : (
          <button className="add-lunch-top-btn" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            schedule a lunch
          </button>
        )}
      </div>
      <NextLunchCard
        lunch={next}
        me={me}
        myTeams={myTeams}
        restaurants={restaurants}
        allLunches={lunches}
        setRsvp={setRsvp}
        setRestaurant={setRestaurant}
        toggleProposal={toggleProposal}
        setNotes={setNotes}
        setVibe={setVibe}
        dietary={dietary}
        restaurantTags={restaurantTags}
        onRemove={() => removeLunch(next.id)}
      />
      <div className="future">
        <div className="section-label">what's coming up</div>
        {rest.length > 0 && (
          <div className="future-grid">
            {rest.slice(0, 8).map(l => (
              <FutureCard key={l.id} lunch={l} me={me} setRsvp={setRsvp} onRemove={() => removeLunch(l.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NextLunchCard({
  lunch, me, myTeams, restaurants, allLunches,
  setRsvp, setRestaurant, toggleProposal, setNotes, setVibe,
  dietary, restaurantTags, onRemove
}) {
  const myRsvp = lunch.rsvps[me];
  const teammates = [...new Set((myTeams || []).flatMap(t => t.members))];
  const yesNames = teammates.filter(n => lunch.rsvps[n] === 'yes');
  const noCount = teammates.filter(n => lunch.rsvps[n] === 'no').length;
  const maybeCount = teammates.filter(n => lunch.rsvps[n] === 'maybe').length;
  const pending = teammates.filter(n => !lunch.rsvps[n]);
  const d = daysUntil(lunch.date);
  const [showAllSpots, setShowAllSpots] = useState(false);

  const proposalEntries = Object.entries(lunch.proposedRestaurants)
    .sort((a, b) => b[1].length - a[1].length);
  const visibleRestaurants = showAllSpots ? restaurants : restaurants.slice(0, 6);

  const myVibe = (lunch.vibes || {})[me];
  const vibeTally = {};
  Object.values(lunch.vibes || {}).forEach(v => { vibeTally[v] = (vibeTally[v] || 0) + 1; });

  const nextPicker = getNextPicker(allLunches, yesNames);

  const getConflicts = (restaurantName) => {
    if (!dietary || !Object.keys(dietary).length) return [];
    const rTags = (restaurantTags || {})[restaurantName] || [];
    return yesNames.filter(n => (dietary[n] || []).some(r => !rTags.includes(r)));
  };

  return (
    <article className="card-hero">
      <div className="hero-header">
        <div>
          <div className="hero-tag">
            {isToday(lunch.date) ? 'today' : d === 1 ? 'tomorrow' : d < 0 ? 'happening now' : `in ${d} days`}
          </div>
          <h2 className="hero-date">{fmtDateLong(lunch.date)}</h2>
          <div className="hero-time">@ {lunch.time}</div>
        </div>
        <button className="hero-remove-btn" onClick={onRemove} title="remove this lunch">
          <Trash2 size={14} />
          remove
        </button>
      </div>

      {/* RSVP */}
      <div className="block">
        <div className="block-label">your rsvp</div>
        <div className="rsvp-row">
          <RsvpBtn status="yes"   active={myRsvp === 'yes'}   onClick={() => setRsvp(lunch.id, 'yes')}   icon={Check}       label="in" />
          <RsvpBtn status="maybe" active={myRsvp === 'maybe'} onClick={() => setRsvp(lunch.id, 'maybe')} icon={HelpCircle}  label="maybe" />
          <RsvpBtn status="no"    active={myRsvp === 'no'}    onClick={() => setRsvp(lunch.id, 'no')}    icon={X}           label="out" />
        </div>
        <div className="rsvp-stats">
          <span className="stat-yes">{yesNames.length} in</span>
          {maybeCount > 0 && <span className="stat-maybe">{maybeCount} maybe</span>}
          {noCount > 0 && <span className="stat-no">{noCount} out</span>}
          {pending.length > 0 && <span className="stat-pending">{pending.length} haven't replied</span>}
        </div>
        <div className="rsvp-people">
          {teammates.map(n => {
            const s = lunch.rsvps[n];
            return (
              <div key={n} className={`person person-${s || 'pending'}`}>
                <span>{n}</span>
                {s === 'yes' && <Check size={11} />}
                {s === 'no' && <X size={11} />}
                {s === 'maybe' && <HelpCircle size={11} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vibe voting */}
      <div className="block">
        <div className="block-label">today's vibe</div>
        <div className="vibe-grid">
          {VIBES.map(v => (
            <button
              key={v}
              className={`vibe-btn ${myVibe === v ? 'active' : ''}`}
              onClick={() => setVibe(lunch.id, v)}
            >
              <span className="vibe-emoji">{VIBE_EMOJI[v]}</span>
              <span>{v}</span>
            </button>
          ))}
        </div>
        {Object.keys(vibeTally).length > 0 && (
          <div className="vibe-tally">
            {Object.entries(vibeTally)
              .sort((a, b) => b[1] - a[1])
              .map(([v, n]) => (
                <span key={v} className="vibe-tally-item">
                  {VIBE_EMOJI[v]} {v} <strong>×{n}</strong>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Restaurant */}
      <div className="block">
        <div className="block-label">where</div>
        {lunch.restaurant ? (
          <div className="picked-row">
            <div className="picked">
              <MapPin size={16} />
              <strong>{lunch.restaurant}</strong>
            </div>
            <button className="link-btn" onClick={() => setRestaurant(lunch.id, null)}>change</button>
          </div>
        ) : (
          <>
            <div className="turn-row">
              {nextPicker && (
                <div className="turn-chip">
                  🎯 {nextPicker}'s turn to pick
                </div>
              )}
              <SpinWheel attendees={yesNames} />
            </div>
            <div className="hint" style={{ marginTop: '0.75rem' }}>
              nothing picked yet — vote for somewhere or lock one in →
            </div>
            {proposalEntries.length > 0 && (
              <div className="proposals">
                {proposalEntries.map(([name, voters]) => {
                  const conflicts = getConflicts(name);
                  return (
                    <div key={name}>
                      <button
                        className="proposal-name-btn"
                        onClick={() => setRestaurant(lunch.id, name)}
                        title="lock this one in"
                      >
                        <span>{name}{conflicts.length > 0 && <span className="compat-warn" title={`${conflicts.join(', ')} may have dietary conflicts`}>⚠️</span>}</span>
                        <span className="proposal-votes">{voters.length} {voters.length === 1 ? 'vote' : 'votes'}</span>
                      </button>
                      <div className="proposal-voters">{voters.join(', ')}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="spot-grid">
              {visibleRestaurants.map(r => {
                const voters = lunch.proposedRestaurants[r.name] || [];
                const iVoted = voters.includes(me);
                const conflicts = getConflicts(r.name);
                return (
                  <button
                    key={r.name}
                    className={`spot-chip ${iVoted ? 'voted' : ''}`}
                    onClick={() => toggleProposal(lunch.id, r.name)}
                  >
                    {iVoted && <Check size={11} />}
                    <span>{r.name}</span>
                    {conflicts.length > 0 && (
                      <span className="compat-warn" title={`${conflicts.join(', ')} may have dietary conflicts`}>⚠️</span>
                    )}
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

      {/* Notes */}
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
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function FutureCard({ lunch, me, setRsvp, onRemove }) {
  const myRsvp = lunch.rsvps[me];
  const yesCount = Object.values(lunch.rsvps).filter(s => s === 'yes').length;
  return (
    <div className="future-card">
      <div className="future-card-top">
        <div className="future-date">{fmtDate(lunch.date)}</div>
        <button className="future-card-del" onClick={onRemove} title="remove">
          <Trash2 size={12} />
        </button>
      </div>
      <div className="future-where">{lunch.restaurant || <em>tbd</em>}</div>
      <div className="future-yes">{yesCount > 0 ? `${yesCount} ${yesCount === 1 ? 'person' : 'people'} in` : 'crickets so far'}</div>
      <div className="future-rsvp">
        <button className={`mini-rsvp ${myRsvp === 'yes' ? 'on yes' : ''}`} onClick={() => setRsvp(lunch.id, 'yes')} title="in"><Check size={12} /></button>
        <button className={`mini-rsvp ${myRsvp === 'maybe' ? 'on maybe' : ''}`} onClick={() => setRsvp(lunch.id, 'maybe')} title="maybe"><HelpCircle size={12} /></button>
        <button className={`mini-rsvp ${myRsvp === 'no' ? 'on no' : ''}`} onClick={() => setRsvp(lunch.id, 'no')} title="out"><X size={12} /></button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { defaultState, generateJoinCode } from './data.js';
import { meStore, fetchState, saveState } from './api.js';
import Gate from './components/Gate.jsx';
import Header from './components/Header.jsx';
import Nav from './components/Nav.jsx';
import UpcomingView from './components/UpcomingView.jsx';
import SpotsView from './components/SpotsView.jsx';
import HistoryView from './components/HistoryView.jsx';
import ProfileView from './components/ProfileView.jsx';

const POLL_MS = 5000;

const STATIC_NAMES = new Set(['Armand', 'Connor', 'Dan', 'Elina', 'Heather', 'Mike', 'Nate', 'Pip']);

function migrateState(s) {
  let changed = false;
  // Drop any system-seeded teams with the old static member list
  let teams = (s.teams || []).filter(t => {
    if (t.createdBy === 'system') { changed = true; return false; }
    return true;
  });
  // Strip static seed names out of any user-created teams that somehow got them
  teams = teams.map(t => {
    const cleaned = t.members.filter(m => !STATIC_NAMES.has(m) || t.createdBy === m);
    if (cleaned.length !== t.members.length) { changed = true; return { ...t, members: cleaned }; }
    return t;
  });
  // Drop teams that end up empty after stripping static names
  teams = teams.filter(t => { if (t.members.length === 0) { changed = true; return false; } return true; });
  // Backfill join codes for any team created before this feature
  teams = teams.map(t => {
    if (!t.joinCode) { changed = true; return { ...t, joinCode: generateJoinCode() }; }
    return t;
  });
  if (!changed) return s;
  return { ...s, teams, version: (s.version || 0) + 1 };
}

export default function App() {
  const [me, setMe] = useState(meStore.get());

  // app state
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming');
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'

  // refs to avoid stale closures in poll/save
  const stateRef = useRef(null);
  stateRef.current = state;
  const pendingSaveRef = useRef(null);

  const handlePickMe = (name, teamId) => {
    meStore.set(name);
    setMe(name);
    if (teamId && stateRef.current) {
      update(s => ({
        ...s,
        teams: (s.teams || []).map(t =>
          t.id === teamId && !t.members.includes(name)
            ? { ...t, members: [...t.members, name] }
            : t
        )
      }));
    }
  };

  const handleSwitchUser = () => {
    meStore.clear();
    setMe('');
  };

  // ---------- initial load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchState();
        if (cancelled) return;
        const s = migrateState(raw || defaultState());
        setState(s);
        if (s !== raw) saveState(s).catch(() => {});
        setSyncStatus('synced');
      } catch (e) {
        if (cancelled) return;
        setState(defaultState());
        setSyncStatus('offline');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // poll for updates from teammates
  useEffect(() => {
    if (!state) return;
    const interval = setInterval(async () => {
      // skip the poll if we have an outbound save in flight — we'll be the
      // freshest version anyway, no need to clobber our optimistic state
      if (pendingSaveRef.current) return;
      try {
        const s = await fetchState();
        if (!s) return;
        if (!stateRef.current || s.version > stateRef.current.version) {
          setState(s);
        }
        setSyncStatus('synced');
      } catch {
        setSyncStatus('offline');
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [state]);

  // ---------- mutations ----------
  const update = useCallback(async (mutator) => {
    const current = stateRef.current;
    if (!current) return;
    const next = {
      ...mutator(current),
      version: (current.version || 0) + 1
    };
    setState(next);
    setSyncStatus('syncing');

    const savePromise = (async () => {
      try {
        await saveState(next);
        setSyncStatus('synced');
      } catch {
        try {
          await new Promise(r => setTimeout(r, 800));
          await saveState(next);
          setSyncStatus('synced');
        } catch {
          setSyncStatus('offline');
        }
      } finally {
        if (pendingSaveRef.current === savePromise) {
          pendingSaveRef.current = null;
        }
      }
    })();
    pendingSaveRef.current = savePromise;
  }, []);

  const setRsvp = (lunchId, status) => {
    if (!me) return;
    update(s => ({
      ...s,
      lunches: s.lunches.map(l =>
        l.id === lunchId ? { ...l, rsvps: { ...l.rsvps, [me]: status } } : l
      )
    }));
  };

  const setRestaurant = (lunchId, name) => {
    update(s => ({
      ...s,
      lunches: s.lunches.map(l =>
        l.id === lunchId ? { ...l, restaurant: name, lockedBy: name ? me : null } : l
      )
    }));
  };

  const setVibe = (lunchId, vibe) => {
    if (!me) return;
    update(s => ({
      ...s,
      lunches: s.lunches.map(l => {
        if (l.id !== lunchId) return l;
        const prev = (l.vibes || {})[me];
        const next = prev === vibe ? null : vibe;
        const newVibes = { ...(l.vibes || {}), [me]: next };
        if (next === null) delete newVibes[me];
        return { ...l, vibes: newVibes };
      })
    }));
  };

  const setRating = (lunchId, rating) => {
    if (!me) return;
    update(s => {
      const existing = { ...((s.ratings || {})[lunchId] || {}) };
      if (rating === null) delete existing[me];
      else existing[me] = rating;
      return { ...s, ratings: { ...(s.ratings || {}), [lunchId]: existing } };
    });
  };

  const setDietary = (tags) => {
    if (!me) return;
    update(s => ({ ...s, dietary: { ...(s.dietary || {}), [me]: tags } }));
  };

  const tagRestaurant = (restaurantName, tags) => {
    update(s => ({ ...s, restaurantTags: { ...(s.restaurantTags || {}), [restaurantName]: tags } }));
  };

  const toggleProposal = (lunchId, restaurantName) => {
    if (!me) return;
    update(s => ({
      ...s,
      lunches: s.lunches.map(l => {
        if (l.id !== lunchId) return l;
        const current = l.proposedRestaurants[restaurantName] || [];
        const updated = current.includes(me)
          ? current.filter(n => n !== me)
          : [...current, me];
        const newProposals = { ...l.proposedRestaurants };
        if (updated.length === 0) delete newProposals[restaurantName];
        else newProposals[restaurantName] = updated;
        return { ...l, proposedRestaurants: newProposals };
      })
    }));
  };

  const setNotes = (lunchId, notes) => {
    update(s => ({
      ...s,
      lunches: s.lunches.map(l => l.id === lunchId ? { ...l, notes } : l)
    }));
  };

  const addRestaurant = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    update(s => {
      if (s.restaurants.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) return s;
      return {
        ...s,
        restaurants: [...s.restaurants, { name: trimmed, addedBy: me || 'someone' }]
      };
    });
  };

  const removeRestaurant = (name) => {
    update(s => ({
      ...s,
      restaurants: s.restaurants.filter(r => r.name !== name)
    }));
  };

  const createTeam = (name, emoji) => {
    if (!me) return;
    const id = `team_${Date.now()}`;
    update(s => ({
      ...s,
      teams: [...(s.teams || []), { id, name, emoji, members: [me], createdBy: me, joinCode: generateJoinCode() }]
    }));
  };

  const joinTeamByCode = (code) => {
    if (!me || !code.trim()) return false;
    const team = (stateRef.current?.teams || []).find(
      t => t.joinCode?.toLowerCase() === code.trim().toLowerCase()
    );
    if (!team) return false;
    if (team.members.includes(me)) return 'already';
    joinTeam(team.id);
    return true;
  };

  const joinTeam = (teamId) => {
    if (!me) return;
    update(s => ({
      ...s,
      teams: (s.teams || []).map(t =>
        t.id === teamId && !t.members.includes(me)
          ? { ...t, members: [...t.members, me] }
          : t
      )
    }));
  };

  const leaveTeam = (teamId) => {
    if (!me) return;
    update(s => ({
      ...s,
      teams: (s.teams || []).map(t =>
        t.id === teamId
          ? { ...t, members: t.members.filter(m => m !== me) }
          : t
      )
    }));
  };

  // ---------- render ----------
  if (loading || !state) {
    return <div className="app"><div className="loading">setting the table…</div></div>;
  }

  if (!me) {
    return <Gate onPick={handlePickMe} teams={state.teams || []} />;
  }

  return (
    <div className="app">
      <Header me={me} syncStatus={syncStatus} onSwitchUser={handleSwitchUser} />
      <Nav view={view} setView={setView} lunches={state.lunches} />
      <main className="main">
        {view === 'upcoming' && (
          <UpcomingView
            lunches={state.lunches}
            me={me}
            teams={state.teams || []}
            restaurants={state.restaurants}
            setRsvp={setRsvp}
            setRestaurant={setRestaurant}
            toggleProposal={toggleProposal}
            setNotes={setNotes}
            setVibe={setVibe}
            dietary={state.dietary || {}}
            restaurantTags={state.restaurantTags || {}}
            setView={setView}
          />
        )}
        {view === 'spots' && (
          <SpotsView
            restaurants={state.restaurants}
            lunches={state.lunches}
            me={me}
            teams={state.teams || []}
            addRestaurant={addRestaurant}
            removeRestaurant={removeRestaurant}
            ratings={state.ratings || {}}
            dietary={state.dietary || {}}
            restaurantTags={state.restaurantTags || {}}
            tagRestaurant={tagRestaurant}
            setView={setView}
          />
        )}
        {view === 'history' && (
          <HistoryView
            lunches={state.lunches}
            me={me}
            teams={state.teams || []}
            ratings={state.ratings || {}}
            setRating={setRating}
            setView={setView}
          />
        )}
        {view === 'profile' && (
          <ProfileView
            me={me}
            teams={state.teams || []}
            lunches={state.lunches}
            createTeam={createTeam}
            joinTeamByCode={joinTeamByCode}
            leaveTeam={leaveTeam}
            dietary={state.dietary || {}}
            setDietary={setDietary}
          />
        )}
      </main>
      <footer className="footer">
        <span>state syncs every {POLL_MS / 1000}s · {state.lunches.length} lunches scheduled</span>
      </footer>
    </div>
  );
}

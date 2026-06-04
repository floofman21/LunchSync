import React, { useState, useEffect, useRef, useCallback } from 'react';
import { defaultRegistry, defaultTeamState, generateJoinCode } from './data.js';
import { meStore, activeTeamStore, fetchRegistry, saveRegistry, fetchTeamState, saveTeamState } from './api.js';
import Gate from './components/Gate.jsx';
import Header from './components/Header.jsx';
import Nav from './components/Nav.jsx';
import UpcomingView from './components/UpcomingView.jsx';
import SpotsView from './components/SpotsView.jsx';
import HistoryView from './components/HistoryView.jsx';
import ProfileView from './components/ProfileView.jsx';

const POLL_MS = 5000;

export default function App() {
  const [me, setMe] = useState(meStore.get());

  const [registry, setRegistry] = useState(null);        // { version, teams: [...] }
  const [teamState, setTeamState] = useState(null);      // { version, teamId, lunches, restaurants, … }
  const [activeTeamId, setActiveTeamId] = useState(activeTeamStore.get());

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming');
  const [syncStatus, setSyncStatus] = useState('synced');

  const registryRef = useRef(null);
  registryRef.current = registry;
  const teamStateRef = useRef(null);
  teamStateRef.current = teamState;
  const activeTeamIdRef = useRef(activeTeamId);
  activeTeamIdRef.current = activeTeamId;
  const meRef = useRef(me);
  meRef.current = me;

  const pendingRegistrySaveRef = useRef(null);
  const pendingTeamSaveRef = useRef(null);

  // ---------- switch active team ----------
  const switchToTeamId = useCallback(async (teamId) => {
    activeTeamStore.set(teamId);
    setActiveTeamId(teamId);
    setTeamState(defaultTeamState(teamId)); // show defaults immediately while loading
    try {
      const ts = await fetchTeamState(teamId);
      if (ts) setTeamState(ts);
    } catch {
      // keep the default
    }
  }, []);

  // ---------- initial load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const reg = await fetchRegistry();
        if (cancelled) return;
        const resolvedReg = reg || defaultRegistry();
        setRegistry(resolvedReg);

        const currentMe = meStore.get();
        const myTeams = resolvedReg.teams.filter(t => t.members.includes(currentMe));
        const storedId = activeTeamStore.get();
        const validStored = myTeams.find(t => t.id === storedId);
        const teamId = validStored ? storedId : (myTeams[0]?.id || null);

        if (teamId) {
          activeTeamStore.set(teamId);
          setActiveTeamId(teamId);
          const ts = await fetchTeamState(teamId);
          if (!cancelled) setTeamState(ts || defaultTeamState(teamId));
        }
        setSyncStatus('synced');
      } catch {
        if (!cancelled) {
          setRegistry(defaultRegistry());
          setSyncStatus('offline');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---------- polling ----------
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pendingRegistrySaveRef.current || pendingTeamSaveRef.current) return;
      try {
        const [reg, ts] = await Promise.all([
          fetchRegistry(),
          activeTeamIdRef.current ? fetchTeamState(activeTeamIdRef.current) : Promise.resolve(null)
        ]);
        if (reg && (!registryRef.current || reg.version > registryRef.current.version)) {
          setRegistry(reg);
        }
        if (ts && (!teamStateRef.current || ts.version > teamStateRef.current.version)) {
          setTeamState(ts);
        }
        setSyncStatus('synced');
      } catch {
        setSyncStatus('offline');
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // ---------- registry update ----------
  const updateRegistry = useCallback(async (mutator) => {
    const current = registryRef.current;
    if (!current) return;
    const next = { ...mutator(current), version: (current.version || 0) + 1 };
    setRegistry(next);
    setSyncStatus('syncing');
    const savePromise = (async () => {
      try {
        await saveRegistry(next);
        setSyncStatus('synced');
      } catch {
        try { await new Promise(r => setTimeout(r, 800)); await saveRegistry(next); setSyncStatus('synced'); }
        catch { setSyncStatus('offline'); }
      } finally {
        if (pendingRegistrySaveRef.current === savePromise) pendingRegistrySaveRef.current = null;
      }
    })();
    pendingRegistrySaveRef.current = savePromise;
  }, []);

  // ---------- team state update ----------
  const updateTeamState = useCallback(async (mutator) => {
    const current = teamStateRef.current;
    if (!current) return;
    const next = { ...mutator(current), version: (current.version || 0) + 1 };
    setTeamState(next);
    setSyncStatus('syncing');
    const savePromise = (async () => {
      try {
        await saveTeamState(next);
        setSyncStatus('synced');
      } catch {
        try { await new Promise(r => setTimeout(r, 800)); await saveTeamState(next); setSyncStatus('synced'); }
        catch { setSyncStatus('offline'); }
      } finally {
        if (pendingTeamSaveRef.current === savePromise) pendingTeamSaveRef.current = null;
      }
    })();
    pendingTeamSaveRef.current = savePromise;
  }, []);

  // ---------- auth ----------
  const handlePickMe = async (name, teamId) => {
    meStore.set(name);
    setMe(name);
    if (teamId) {
      await updateRegistry(r => ({
        ...r,
        teams: r.teams.map(t =>
          t.id === teamId && !t.members.includes(name)
            ? { ...t, members: [...t.members, name] }
            : t
        )
      }));
      await switchToTeamId(teamId);
    }
  };

  const handleSwitchUser = () => {
    meStore.clear();
    setMe('');
  };

  // ---------- team mutations (registry) ----------
  const createTeam = async (name, emoji) => {
    if (!me) return;
    const id = `team_${Date.now()}`;
    const joinCode = generateJoinCode();
    const newTeamState = defaultTeamState(id);
    await updateRegistry(r => ({
      ...r,
      teams: [...r.teams, { id, name, emoji, members: [me], createdBy: me, joinCode }]
    }));
    saveTeamState(newTeamState).catch(() => {});
    await switchToTeamId(id);
  };

  const joinTeamByCode = async (code) => {
    if (!me || !code.trim()) return false;
    const team = (registryRef.current?.teams || []).find(
      t => t.joinCode?.toLowerCase() === code.trim().toLowerCase()
    );
    if (!team) return false;
    if (team.members.includes(me)) return 'already';
    await updateRegistry(r => ({
      ...r,
      teams: r.teams.map(t =>
        t.id === team.id && !t.members.includes(me)
          ? { ...t, members: [...t.members, me] }
          : t
      )
    }));
    await switchToTeamId(team.id);
    return true;
  };

  const leaveTeam = (teamId) => {
    if (!me) return;
    const currentTeams = registryRef.current?.teams || [];
    updateRegistry(r => ({
      ...r,
      teams: r.teams.map(t =>
        t.id === teamId ? { ...t, members: t.members.filter(m => m !== me) } : t
      )
    }));
    if (activeTeamId === teamId) {
      const next = currentTeams.find(t => t.id !== teamId && t.members.includes(me));
      if (next) {
        switchToTeamId(next.id);
      } else {
        activeTeamStore.clear();
        setActiveTeamId(null);
        setTeamState(null);
      }
    }
  };

  // ---------- team state mutations ----------
  const setRsvp = (lunchId, status) => {
    if (!me) return;
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l =>
        l.id === lunchId ? { ...l, rsvps: { ...l.rsvps, [me]: status } } : l
      )
    }));
  };

  const setRestaurant = (lunchId, name) => {
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l =>
        l.id === lunchId ? { ...l, restaurant: name, lockedBy: name ? me : null } : l
      )
    }));
  };

  const setVibe = (lunchId, vibe) => {
    if (!me) return;
    updateTeamState(s => ({
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
    updateTeamState(s => {
      const existing = { ...((s.ratings || {})[lunchId] || {}) };
      if (rating === null) delete existing[me];
      else existing[me] = rating;
      return { ...s, ratings: { ...(s.ratings || {}), [lunchId]: existing } };
    });
  };

  const setDietary = (tags) => {
    if (!me) return;
    updateTeamState(s => ({ ...s, dietary: { ...(s.dietary || {}), [me]: tags } }));
  };

  const tagRestaurant = (restaurantName, tags) => {
    updateTeamState(s => ({ ...s, restaurantTags: { ...(s.restaurantTags || {}), [restaurantName]: tags } }));
  };

  const toggleProposal = (lunchId, restaurantName) => {
    if (!me) return;
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l => {
        if (l.id !== lunchId) return l;
        const current = l.proposedRestaurants[restaurantName] || [];
        const updated = current.includes(me) ? current.filter(n => n !== me) : [...current, me];
        const newProposals = { ...l.proposedRestaurants };
        if (updated.length === 0) delete newProposals[restaurantName];
        else newProposals[restaurantName] = updated;
        return { ...l, proposedRestaurants: newProposals };
      })
    }));
  };

  const setNotes = (lunchId, notes) => {
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l => l.id === lunchId ? { ...l, notes } : l)
    }));
  };

  const addLunch = (date, time) => {
    if (!date) return;
    const id = `lunch_${date}_${Date.now()}`;
    updateTeamState(s => {
      const entry = { id, date, time: time || '12:15', restaurant: null, lockedBy: null, vibes: {}, rsvps: {}, proposedRestaurants: {}, notes: '' };
      const sorted = [...s.lunches, entry].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      return { ...s, lunches: sorted };
    });
  };

  const removeLunch = (lunchId) => {
    updateTeamState(s => ({ ...s, lunches: s.lunches.filter(l => l.id !== lunchId) }));
  };

  const addRestaurant = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateTeamState(s => {
      if (s.restaurants.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) return s;
      return { ...s, restaurants: [...s.restaurants, { name: trimmed, addedBy: me || 'someone' }] };
    });
  };

  const removeRestaurant = (name) => {
    updateTeamState(s => ({ ...s, restaurants: s.restaurants.filter(r => r.name !== name) }));
  };

  // ---------- render ----------
  if (loading) {
    return <div className="app"><div className="loading">setting the table…</div></div>;
  }

  if (!me) {
    return <Gate onPick={handlePickMe} teams={registry?.teams || []} />;
  }

  const teams = registry?.teams || [];
  const activeTeam = teams.find(t => t.id === activeTeamId) || null;
  // Views only see the active team — never leak other teams' member lists
  const activeTeamList = activeTeam ? [activeTeam] : [];
  const lunches     = teamState?.lunches      || [];
  const restaurants = teamState?.restaurants  || [];
  const ratings     = teamState?.ratings      || {};
  const dietary     = teamState?.dietary      || {};
  const restaurantTags = teamState?.restaurantTags || {};

  return (
    <div className="app">
      <Header me={me} syncStatus={syncStatus} onSwitchUser={handleSwitchUser} activeTeam={activeTeam} />
      <Nav view={view} setView={setView} lunches={lunches} />
      <main className="main">
        {view === 'upcoming' && (
          <UpcomingView
            lunches={lunches} me={me} teams={activeTeamList}
            restaurants={restaurants}
            setRsvp={setRsvp} setRestaurant={setRestaurant}
            toggleProposal={toggleProposal} setNotes={setNotes} setVibe={setVibe}
            dietary={dietary} restaurantTags={restaurantTags}
            setView={setView}
            addLunch={addLunch} removeLunch={removeLunch}
          />
        )}
        {view === 'spots' && (
          <SpotsView
            restaurants={restaurants} lunches={lunches} me={me} teams={activeTeamList}
            addRestaurant={addRestaurant} removeRestaurant={removeRestaurant}
            ratings={ratings} dietary={dietary} restaurantTags={restaurantTags}
            tagRestaurant={tagRestaurant} setView={setView}
          />
        )}
        {view === 'history' && (
          <HistoryView
            lunches={lunches} me={me} teams={activeTeamList}
            ratings={ratings} setRating={setRating} setView={setView}
          />
        )}
        {view === 'profile' && (
          <ProfileView
            me={me} teams={teams} lunches={lunches}
            activeTeamId={activeTeamId} switchToTeamId={switchToTeamId}
            createTeam={createTeam} joinTeamByCode={joinTeamByCode} leaveTeam={leaveTeam}
            dietary={dietary} setDietary={setDietary}
          />
        )}
      </main>
      <footer className="footer">
        <span>syncs every {POLL_MS / 1000}s{activeTeam ? ` · ${activeTeam.emoji} ${activeTeam.name}` : ''}</span>
      </footer>
    </div>
  );
}

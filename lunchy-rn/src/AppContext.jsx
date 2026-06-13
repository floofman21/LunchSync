import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { defaultRegistry, defaultTeamState, generateJoinCode } from './data';
import { meStore, activeTeamStore, fetchRegistry, saveRegistry, fetchTeamState, saveTeamState } from './api';

const POLL_MS = 5000;

const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [me,           setMe]           = useState('');
  const [registry,     setRegistry]     = useState(null);
  const [teamState,    setTeamState]    = useState(null);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [syncStatus,   setSyncStatus]   = useState('synced');

  const registryRef     = useRef(null);
  registryRef.current   = registry;
  const teamStateRef    = useRef(null);
  teamStateRef.current  = teamState;
  const activeTeamIdRef = useRef(activeTeamId);
  activeTeamIdRef.current = activeTeamId;
  const meRef = useRef(me);
  meRef.current = me;

  const pendingRegistrySaveRef = useRef(null);
  const pendingTeamSaveRef     = useRef(null);

  // ── switch active team ──────────────────────────────────────────────────────
  const switchToTeamId = useCallback(async (teamId) => {
    activeTeamStore.set(teamId);
    setActiveTeamId(teamId);
    setTeamState(defaultTeamState(teamId));
    try {
      const ts = await fetchTeamState(teamId);
      if (ts) setTeamState(ts);
    } catch {}
  }, []);

  // ── initial load (reads AsyncStorage then hits API) ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [storedMe, storedTeamId] = await Promise.all([meStore.get(), activeTeamStore.get()]);
        if (!cancelled) setMe(storedMe || '');

        const reg = await fetchRegistry();
        if (cancelled) return;
        const resolvedReg = reg || defaultRegistry();
        setRegistry(resolvedReg);

        const currentMe  = storedMe || '';
        const myTeams    = resolvedReg.teams.filter(t => t.members.includes(currentMe));
        const validStored = myTeams.find(t => t.id === storedTeamId);
        const teamId     = validStored ? storedTeamId : (myTeams[0]?.id || null);

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

  // ── polling ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pendingRegistrySaveRef.current || pendingTeamSaveRef.current) return;
      try {
        const [reg, ts] = await Promise.all([
          fetchRegistry(),
          activeTeamIdRef.current ? fetchTeamState(activeTeamIdRef.current) : Promise.resolve(null),
        ]);
        if (reg && (!registryRef.current || reg.version > registryRef.current.version)) setRegistry(reg);
        if (ts  && (!teamStateRef.current || ts.version > teamStateRef.current.version))  setTeamState(ts);
        setSyncStatus('synced');
      } catch {
        setSyncStatus('offline');
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // ── registry update helper ──────────────────────────────────────────────────
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
        try {
          await new Promise(r => setTimeout(r, 800));
          await saveRegistry(next);
          setSyncStatus('synced');
        } catch {
          setSyncStatus('offline');
        }
      } finally {
        if (pendingRegistrySaveRef.current === savePromise) pendingRegistrySaveRef.current = null;
      }
    })();
    pendingRegistrySaveRef.current = savePromise;
  }, []);

  // ── team state update helper ────────────────────────────────────────────────
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
        try {
          await new Promise(r => setTimeout(r, 800));
          await saveTeamState(next);
          setSyncStatus('synced');
        } catch {
          setSyncStatus('offline');
        }
      } finally {
        if (pendingTeamSaveRef.current === savePromise) pendingTeamSaveRef.current = null;
      }
    })();
    pendingTeamSaveRef.current = savePromise;
  }, []);

  // ── auth ────────────────────────────────────────────────────────────────────
  const handlePickMe = async (name, teamId) => {
    await meStore.set(name);
    setMe(name);
    if (teamId) {
      await updateRegistry(r => ({
        ...r,
        teams: r.teams.map(t =>
          t.id === teamId && !t.members.includes(name)
            ? { ...t, members: [...t.members, name] }
            : t
        ),
      }));
      await switchToTeamId(teamId);
    }
  };

  const handleSwitchUser = async () => {
    await meStore.clear();
    setMe('');
  };

  // ── team mutations (registry) ───────────────────────────────────────────────
  const createTeam = async (name, emoji) => {
    if (!meRef.current) return;
    const id        = `team_${Date.now()}`;
    const joinCode  = generateJoinCode();
    const newTeamState = defaultTeamState(id);
    await updateRegistry(r => ({
      ...r,
      teams: [...r.teams, { id, name, emoji, members: [meRef.current], createdBy: meRef.current, joinCode }],
    }));
    saveTeamState(newTeamState).catch(() => {});
    await switchToTeamId(id);
  };

  const joinTeamByCode = async (code) => {
    if (!meRef.current || !code.trim()) return false;
    const team = (registryRef.current?.teams || []).find(
      t => t.joinCode?.toLowerCase() === code.trim().toLowerCase()
    );
    if (!team) return false;
    if (team.members.includes(meRef.current)) return 'already';
    await updateRegistry(r => ({
      ...r,
      teams: r.teams.map(t =>
        t.id === team.id && !t.members.includes(meRef.current)
          ? { ...t, members: [...t.members, meRef.current] }
          : t
      ),
    }));
    await switchToTeamId(team.id);
    return true;
  };

  const leaveTeam = (teamId) => {
    if (!meRef.current) return;
    const currentTeams = registryRef.current?.teams || [];
    updateRegistry(r => ({
      ...r,
      teams: r.teams.map(t =>
        t.id === teamId ? { ...t, members: t.members.filter(m => m !== meRef.current) } : t
      ),
    }));
    if (activeTeamIdRef.current === teamId) {
      const next = currentTeams.find(t => t.id !== teamId && t.members.includes(meRef.current));
      if (next) {
        switchToTeamId(next.id);
      } else {
        activeTeamStore.clear();
        setActiveTeamId(null);
        setTeamState(null);
      }
    }
  };

  // ── team state mutations ────────────────────────────────────────────────────
  const setRsvp = (lunchId, status) => {
    if (!meRef.current) return;
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l =>
        l.id === lunchId ? { ...l, rsvps: { ...l.rsvps, [meRef.current]: status } } : l
      ),
    }));
  };

  const setRestaurant = (lunchId, name) => {
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l =>
        l.id === lunchId ? { ...l, restaurant: name, lockedBy: name ? meRef.current : null } : l
      ),
    }));
  };

  const setVibe = (lunchId, vibe) => {
    if (!meRef.current) return;
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l => {
        if (l.id !== lunchId) return l;
        const prev = (l.vibes || {})[meRef.current];
        const next = prev === vibe ? null : vibe;
        const newVibes = { ...(l.vibes || {}), [meRef.current]: next };
        if (next === null) delete newVibes[meRef.current];
        return { ...l, vibes: newVibes };
      }),
    }));
  };

  const setRating = (lunchId, rating) => {
    if (!meRef.current) return;
    updateTeamState(s => {
      const existing = { ...((s.ratings || {})[lunchId] || {}) };
      if (rating === null) delete existing[meRef.current];
      else existing[meRef.current] = rating;
      return { ...s, ratings: { ...(s.ratings || {}), [lunchId]: existing } };
    });
  };

  const setDietary = (tags) => {
    if (!meRef.current) return;
    updateTeamState(s => ({ ...s, dietary: { ...(s.dietary || {}), [meRef.current]: tags } }));
  };

  const tagRestaurant = (restaurantName, tags) => {
    updateTeamState(s => ({ ...s, restaurantTags: { ...(s.restaurantTags || {}), [restaurantName]: tags } }));
  };

  const toggleProposal = (lunchId, restaurantName) => {
    if (!meRef.current) return;
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l => {
        if (l.id !== lunchId) return l;
        const current = l.proposedRestaurants[restaurantName] || [];
        const updated = current.includes(meRef.current)
          ? current.filter(n => n !== meRef.current)
          : [...current, meRef.current];
        const newProposals = { ...l.proposedRestaurants };
        if (updated.length === 0) delete newProposals[restaurantName];
        else newProposals[restaurantName] = updated;
        return { ...l, proposedRestaurants: newProposals };
      }),
    }));
  };

  const setNotes = (lunchId, notes) => {
    updateTeamState(s => ({
      ...s,
      lunches: s.lunches.map(l => l.id === lunchId ? { ...l, notes } : l),
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
      return { ...s, restaurants: [...s.restaurants, { name: trimmed, addedBy: meRef.current || 'someone' }] };
    });
  };

  const removeRestaurant = (name) => {
    updateTeamState(s => ({ ...s, restaurants: s.restaurants.filter(r => r.name !== name) }));
  };

  // ── derived values ──────────────────────────────────────────────────────────
  const teams           = registry?.teams || [];
  const activeTeam      = teams.find(t => t.id === activeTeamId) || null;
  const activeTeamList  = activeTeam ? [activeTeam] : [];
  const lunches         = teamState?.lunches       || [];
  const restaurants     = teamState?.restaurants   || [];
  const ratings         = teamState?.ratings       || {};
  const dietary         = teamState?.dietary       || {};
  const restaurantTags  = teamState?.restaurantTags || {};

  const value = {
    me, loading, syncStatus, activeTeam, activeTeamId,
    teams, activeTeamList, lunches, restaurants, ratings, dietary, restaurantTags,
    handlePickMe, handleSwitchUser,
    switchToTeamId, createTeam, joinTeamByCode, leaveTeam,
    setRsvp, setRestaurant, setVibe, setRating, setDietary, tagRestaurant,
    toggleProposal, setNotes, addLunch, removeLunch, addRestaurant, removeRestaurant,
    POLL_MS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { defaultState } from './data.js';
import { tokenStore, meStore, login, fetchState, saveState } from './api.js';
import Gate from './components/Gate.jsx';
import Header from './components/Header.jsx';
import Nav from './components/Nav.jsx';
import UpcomingView from './components/UpcomingView.jsx';
import SpotsView from './components/SpotsView.jsx';
import HistoryView from './components/HistoryView.jsx';

const POLL_MS = 5000;

export default function App() {
  // auth state
  const [token, setToken] = useState(tokenStore.get());
  const [me, setMe] = useState(meStore.get());
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // app state
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming');
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'

  // refs to avoid stale closures in poll/save
  const stateRef = useRef(null);
  stateRef.current = state;
  const pendingSaveRef = useRef(null);

  // ---------- auth ----------
  const handleLogin = async (passphrase) => {
    setAuthError('');
    setAuthBusy(true);
    try {
      const t = await login(passphrase);
      setToken(t);
    } catch (e) {
      setAuthError(e.code === 'bad_passphrase' ? "That passphrase didn't work." : 'Could not log in. Try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    tokenStore.clear();
    meStore.clear();
    setToken('');
    setMe('');
    setState(null);
  };

  const handlePickMe = (name) => {
    meStore.set(name);
    setMe(name);
  };

  const handleSwitchUser = () => {
    meStore.clear();
    setMe('');
  };

  // ---------- initial load + polling ----------
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const s = await fetchState();
        if (cancelled) return;
        setState(s || defaultState());
        setSyncStatus('synced');
      } catch (e) {
        if (e.code === 'unauthorized') {
          tokenStore.clear();
          setToken('');
        } else {
          setSyncStatus('offline');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  // poll for updates from teammates
  useEffect(() => {
    if (!token || !state) return;
    const interval = setInterval(async () => {
      // skip the poll if we have an outbound save in flight — we'll be the
      // freshest version anyway, no need to clobber our optimistic state
      if (pendingSaveRef.current) return;
      try {
        const s = await fetchState();
        if (!s) return;
        // only update if the server version is newer than what we have
        if (!stateRef.current || s.version > stateRef.current.version) {
          setState(s);
        }
        setSyncStatus('synced');
      } catch (e) {
        if (e.code === 'unauthorized') {
          tokenStore.clear();
          setToken('');
        } else {
          setSyncStatus('offline');
        }
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [token, state]);

  // ---------- mutations ----------
  // Optimistic update: bump version, render immediately, save in background.
  // If the save fails we retry once; if it still fails, the next poll will
  // pull the server's version and supersede ours.
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
      } catch (e) {
        try {
          await new Promise(r => setTimeout(r, 800));
          await saveState(next);
          setSyncStatus('synced');
        } catch (e2) {
          if (e2.code === 'unauthorized') {
            tokenStore.clear();
            setToken('');
          } else {
            setSyncStatus('offline');
          }
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
        l.id === lunchId ? { ...l, restaurant: name } : l
      )
    }));
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

  // ---------- render ----------
  if (!token) {
    return (
      <Gate
        mode="passphrase"
        onLogin={handleLogin}
        error={authError}
        busy={authBusy}
      />
    );
  }

  if (loading || !state) {
    return <div className="app"><div className="loading">setting the table…</div></div>;
  }

  if (!me) {
    return <Gate mode="name" onPick={handlePickMe} onLogout={handleLogout} />;
  }

  return (
    <div className="app">
      <Header me={me} syncStatus={syncStatus} onSwitchUser={handleSwitchUser} onLogout={handleLogout} />
      <Nav view={view} setView={setView} lunches={state.lunches} />
      <main className="main">
        {view === 'upcoming' && (
          <UpcomingView
            lunches={state.lunches}
            me={me}
            restaurants={state.restaurants}
            setRsvp={setRsvp}
            setRestaurant={setRestaurant}
            toggleProposal={toggleProposal}
            setNotes={setNotes}
          />
        )}
        {view === 'spots' && (
          <SpotsView
            restaurants={state.restaurants}
            lunches={state.lunches}
            addRestaurant={addRestaurant}
            removeRestaurant={removeRestaurant}
          />
        )}
        {view === 'history' && <HistoryView lunches={state.lunches} />}
      </main>
      <footer className="footer">
        <span>state syncs every {POLL_MS / 1000}s · {state.lunches.length} lunches scheduled</span>
      </footer>
    </div>
  );
}

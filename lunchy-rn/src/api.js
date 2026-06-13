import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './config';

const ME_KEY          = 'lunchsync:me';
const ACTIVE_TEAM_KEY = 'lunchsync:activeTeam';

export const meStore = {
  get:   ()  => AsyncStorage.getItem(ME_KEY).then(v => v || '').catch(() => ''),
  set:   (n) => AsyncStorage.setItem(ME_KEY, n).catch(() => {}),
  clear: ()  => AsyncStorage.removeItem(ME_KEY).catch(() => {}),
};

export const activeTeamStore = {
  get:   ()   => AsyncStorage.getItem(ACTIVE_TEAM_KEY).then(v => v || null).catch(() => null),
  set:   (id) => (id
    ? AsyncStorage.setItem(ACTIVE_TEAM_KEY, id)
    : AsyncStorage.removeItem(ACTIVE_TEAM_KEY)
  ).catch(() => {}),
  clear: ()   => AsyncStorage.removeItem(ACTIVE_TEAM_KEY).catch(() => {}),
};

async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}/api/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`request failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export const fetchRegistry  = ()       => request('state');
export const saveRegistry   = (reg)    => request('state', { method: 'POST', body: JSON.stringify(reg) });
export const fetchTeamState = (teamId) => request(`state?team=${encodeURIComponent(teamId)}`);
export const saveTeamState  = (state)  => request(`state?team=${encodeURIComponent(state.teamId)}`, { method: 'POST', body: JSON.stringify(state) });

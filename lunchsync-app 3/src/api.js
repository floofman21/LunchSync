const ME_KEY = 'lunchsync:me';
const ACTIVE_TEAM_KEY = 'lunchsync:activeTeam';

export const meStore = {
  get: () => { try { return localStorage.getItem(ME_KEY) || ''; } catch { return ''; } },
  set: (n) => { try { localStorage.setItem(ME_KEY, n); } catch {} },
  clear: () => { try { localStorage.removeItem(ME_KEY); } catch {} }
};

export const activeTeamStore = {
  get: () => { try { return localStorage.getItem(ACTIVE_TEAM_KEY) || null; } catch { return null; } },
  set: (id) => { try { id ? localStorage.setItem(ACTIVE_TEAM_KEY, id) : localStorage.removeItem(ACTIVE_TEAM_KEY); } catch {} },
  clear: () => { try { localStorage.removeItem(ACTIVE_TEAM_KEY); } catch {} }
};

async function request(path, opts = {}) {
  const res = await fetch(`/api/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (!res.ok) throw new Error(`request failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export const fetchRegistry    = ()        => request('state');
export const saveRegistry     = (reg)     => request('state', { method: 'POST', body: JSON.stringify(reg) });
export const fetchTeamState   = (teamId)  => request(`state?team=${encodeURIComponent(teamId)}`);
export const saveTeamState    = (state)   => request(`state?team=${encodeURIComponent(state.teamId)}`, { method: 'POST', body: JSON.stringify(state) });

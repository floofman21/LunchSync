// Tiny API client. All state lives on the server (Netlify Blobs);
// the only thing we keep on the device is the passphrase + the chosen name.

const TOKEN_KEY = 'lunchsync:token';
const ME_KEY = 'lunchsync:me';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch {} },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch {} }
};

export const meStore = {
  get: () => { try { return localStorage.getItem(ME_KEY) || ''; } catch { return ''; } },
  set: (n) => { try { localStorage.setItem(ME_KEY, n); } catch {} },
  clear: () => { try { localStorage.removeItem(ME_KEY); } catch {} }
};

async function request(path, opts = {}) {
  const token = tokenStore.get();
  const res = await fetch(`/api/${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-team-token': token,
      ...(opts.headers || {})
    }
  });
  if (res.status === 401) {
    const err = new Error('unauthorized');
    err.code = 'unauthorized';
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`request failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function login(passphrase) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passphrase })
  });
  if (!res.ok) {
    const err = new Error('login_failed');
    err.code = res.status === 401 ? 'bad_passphrase' : 'login_failed';
    throw err;
  }
  const { token } = await res.json();
  tokenStore.set(token);
  return token;
}

export async function fetchState() {
  return request('state');
}

// fire-and-forget save — server is authoritative, but we send the
// version we saw and the server merges by version. simple last-write-wins
// is fine for a team of 8.
export async function saveState(state) {
  return request('state', {
    method: 'POST',
    body: JSON.stringify(state)
  });
}

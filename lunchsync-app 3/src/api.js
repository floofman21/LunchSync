// Tiny API client. State lives on the server (Netlify Blobs).
// We just keep the chosen name on the device.

const ME_KEY = 'lunchsync:me';

export const meStore = {
  get: () => { try { return localStorage.getItem(ME_KEY) || ''; } catch { return ''; } },
  set: (n) => { try { localStorage.setItem(ME_KEY, n); } catch {} },
  clear: () => { try { localStorage.removeItem(ME_KEY); } catch {} }
};

async function request(path, opts = {}) {
  const res = await fetch(`/api/${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`request failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function fetchState() {
  return request('state');
}

// fire-and-forget save — server is authoritative, but we send the
// version we saw and the server stores last-write-wins.
export async function saveState(state) {
  return request('state', {
    method: 'POST',
    body: JSON.stringify(state)
  });
}

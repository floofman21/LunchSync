// GET  /api/state  — returns the current shared state JSON (or null if empty)
// POST /api/state  — body is the full state object; saves it
//
// No auth. Anyone who can reach the endpoint can read/write state.
// Fine for local dev or a private internal deployment.
// Storage: Netlify Blobs, one key "current".

import { getStore } from '@netlify/blobs';

const STORE_NAME = 'lunchsync';
const STATE_KEY = 'current';

export default async (req) => {
  const store = getStore(STORE_NAME);

  if (req.method === 'GET') {
    const raw = await store.get(STATE_KEY);
    const body = raw ? raw : 'null';
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch {
      return new Response('bad request', { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return new Response('bad state shape', { status: 400 });
    }
    // sanity guard against runaway payloads (~256 KB is plenty for our use)
    const serialized = JSON.stringify(body);
    if (serialized.length > 256 * 1024) {
      return new Response('payload too large', { status: 413 });
    }
    await store.set(STATE_KEY, serialized);
    return new Response(
      JSON.stringify({ ok: true, version: body.version || 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response('method not allowed', { status: 405 });
};

export const config = { path: '/api/state' };

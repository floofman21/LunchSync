// GET  /api/state           → registry (team list + membership)
// GET  /api/state?team=<id> → that team's state (lunches, restaurants, …)
// POST /api/state           → save registry
// POST /api/state?team=<id> → save team state

import { getStore } from '@netlify/blobs';

const STORE_NAME = 'lunchsync';

function blobKey(url) {
  const teamId = new URL(url).searchParams.get('team');
  return teamId || 'registry';
}

export default async (req) => {
  const store = getStore(STORE_NAME);
  const key = blobKey(req.url);

  if (req.method === 'GET') {
    const raw = await store.get(key);
    return new Response(raw || 'null', {
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
    const serialized = JSON.stringify(body);
    if (serialized.length > 256 * 1024) {
      return new Response('payload too large', { status: 413 });
    }
    await store.set(key, serialized);
    return new Response(
      JSON.stringify({ ok: true, version: body.version || 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response('method not allowed', { status: 405 });
};

export const config = { path: '/api/state' };

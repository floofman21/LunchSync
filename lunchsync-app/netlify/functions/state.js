// GET  /api/state  — returns the current shared state JSON (or null if empty)
// POST /api/state  — body is the full state object; saves it
//
// Auth: requires x-team-token header matching HMAC(TEAM_PASSPHRASE, TEAM_SECRET).
// Storage: Netlify Blobs, one key "current".

import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const PASSPHRASE = process.env.TEAM_PASSPHRASE || '';
const SECRET = process.env.TEAM_SECRET || 'change-me-in-production-please';
const STORE_NAME = 'lunchsync';
const STATE_KEY = 'current';

function expectedToken() {
  return crypto.createHmac('sha256', SECRET).update(PASSPHRASE).digest('hex');
}

function checkAuth(req) {
  if (!PASSPHRASE) return { ok: false, status: 500, msg: 'TEAM_PASSPHRASE not set' };
  const token = req.headers.get('x-team-token') || '';
  const expected = expectedToken();
  if (token.length !== expected.length) return { ok: false, status: 401, msg: 'unauthorized' };
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, status: 401, msg: 'unauthorized' };
  return { ok: true };
}

export default async (req) => {
  const auth = checkAuth(req);
  if (!auth.ok) {
    return new Response(
      JSON.stringify({ error: auth.msg }),
      { status: auth.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

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

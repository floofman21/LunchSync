// POST /api/login
// Body: { passphrase: string }
// Validates against TEAM_PASSPHRASE env var. Returns a token (HMAC of the
// passphrase + a server secret) which the client sends as x-team-token
// on every subsequent request.
//
// This isn't fortress-grade security — it's a "lunch planner with one
// shared password" level of security. Anyone with the passphrase is in.

import crypto from 'node:crypto';

const PASSPHRASE = process.env.TEAM_PASSPHRASE || '';
const SECRET = process.env.TEAM_SECRET || 'change-me-in-production-please';

function makeToken(passphrase) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(passphrase)
    .digest('hex');
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  if (!PASSPHRASE) {
    return new Response(
      JSON.stringify({ error: 'TEAM_PASSPHRASE env var not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('bad request', { status: 400 });
  }

  const submitted = String(body.passphrase || '');
  // constant-time compare to avoid trivial timing leaks
  const aBuf = Buffer.from(submitted.padEnd(64, '\0').slice(0, 64));
  const bBuf = Buffer.from(PASSPHRASE.padEnd(64, '\0').slice(0, 64));
  const match = submitted.length === PASSPHRASE.length && crypto.timingSafeEqual(aBuf, bBuf);

  if (!match) {
    return new Response(
      JSON.stringify({ error: 'wrong passphrase' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = makeToken(PASSPHRASE);
  return new Response(
    JSON.stringify({ token }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const config = { path: '/api/login' };

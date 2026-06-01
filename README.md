# LunchSync

A real-time team lunch planner for small teams. RSVPs, restaurant voting, vibe polls, dietary compatibility, turn rotation, post-lunch ratings, and team profiles — syncing across the whole team every 5 seconds.

**App code lives in [`lunchsync-app 3/`](./lunchsync-app%203/) — see its [README](./lunchsync-app%203/README.md) for full setup and local dev instructions.**

---

## Quick start

```bash
cd "lunchsync-app 3"
npm install
netlify dev          # requires: npm install -g netlify-cli
```

Open **http://localhost:8888**, pick your name, and you're in.

## Stack

- **React 18 + Vite** — frontend
- **Netlify Functions** — single serverless endpoint (`/api/state`)
- **Netlify Blobs** — KV store for shared state (free tier, no setup)
- **No auth, no accounts** — name is stored in `localStorage`; the URL is the secret

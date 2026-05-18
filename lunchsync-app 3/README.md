# LunchSync

A shared lunch planner for the PM Pears. RSVPs, restaurant voting, history.
State syncs across the whole team via Netlify Blobs.

## Stack

- React + Vite (frontend)
- Netlify Functions (one endpoint for state)
- Netlify Blobs (KV storage, built in, free)
- No auth — anyone with the URL can use it

## Run locally

```bash
npm install
npm install -g netlify-cli     # one-time
netlify dev
```

Open the URL it prints (usually http://localhost:8888). Pick your name. Done.

State persists in an in-memory Blobs emulator while `netlify dev` is running.
If you want it to survive restarts, run `netlify login && netlify init` once
to link to a Netlify project — then local dev uses the real Blobs store.

## Deploy to Netlify (when you're ready to share)

1. Push to GitHub: `git init && git add . && git commit -m "v1" && gh repo create lunchsync --private --source=. --push`
2. Go to https://app.netlify.com/start, pick the repo. Build settings auto-detect from `netlify.toml`.
3. Wait ~60 seconds for the deploy. That's it.

No environment variables, no auth, no signup. Anyone with the URL can read and edit the team's lunches. If you want to lock it down later, the `state.js` function is the place to add an auth check.

## Architecture notes

**No auth right now.** This was an explicit choice for v1 — the URL is the secret. If you start sharing it widely or worry about randos, add a passphrase check in `netlify/functions/state.js`.

**Last-write-wins** for conflicts. If two people RSVP at the same millisecond, whoever's POST lands second wins, and both see the merged result within 5s. Fine for lunch.

**Polling at 5s.** ~12 GET requests per active user per minute, well inside Netlify's free Functions tier (125k invocations/month). Would only switch to SSE if you wanted sub-second sync.

**Storage.** All state lives in a single Netlify Blob keyed `current`. The whole state object (~5–20 KB) goes back and forth on each request. Simple, fine at this scale.

## File map

```
src/
  App.jsx              # main component, owns sync state
  api.js               # client for /api/state
  data.js              # seed data, default state, date helpers
  styles.css           # all CSS
  main.jsx             # entry point
  components/
    Gate.jsx           # name picker
    Header.jsx         # brand + sync indicator + me chip
    Nav.jsx            # tabs
    UpcomingView.jsx
    SpotsView.jsx
    HistoryView.jsx

netlify/
  functions/
    state.js           # GET/POST /api/state
```

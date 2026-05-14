# LunchSync

A shared lunch planner for the PM Pears. RSVPs, restaurant voting, history. State syncs across the whole team via Netlify Blobs.

## Stack

- React + Vite (frontend)
- Netlify Functions (one endpoint for state, one for login)
- Netlify Blobs (KV storage, built in, free)
- One shared team passphrase for auth (no accounts, no emails)

## Deploy to Netlify (5 minutes)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "lunchsync v1"
gh repo create lunchsync --private --source=. --push
```

(or push to a repo you create through the GitHub UI)

### 2. Connect to Netlify

- Go to https://app.netlify.com/start
- Pick your repo
- Build settings auto-detect from `netlify.toml`. No changes needed.

### 3. Set environment variables

In **Site settings → Environment variables**, add two:

| Key | Value |
|---|---|
| `TEAM_PASSPHRASE` | a passphrase you'll share with the team (e.g. `pears-on-friday`) |
| `TEAM_SECRET` | any long random string — `openssl rand -hex 32` works fine |

Then trigger a redeploy (Deploys → Trigger deploy → Clear cache and deploy site).

### 4. Share

Send your team the URL + the passphrase. Done.

## Local development

```bash
npm install
npx netlify link   # link to your Netlify site (one-time)
npx netlify dev    # runs Vite + Functions + Blobs locally
```

Visit http://localhost:8888. Local dev uses an in-memory blob store, so state resets when you stop the dev server.

## Architecture notes

**Why one shared passphrase?** The team is 8 people. Real auth (email/OAuth/SSO) is overkill and adds friction. The passphrase + HMAC token is enough to keep randos off the URL, which is the actual threat model.

**Why polling, not websockets/SSE?** Polling every 5s is fine for 8 people. ~17 GET requests per active user per minute, well inside Netlify's free Functions tier (125k invocations/month).

**Conflict resolution.** Last write wins, with a `version` counter to skip stale-poll overwrites. If Connor and Mike RSVP simultaneously, whoever's request hits the server last wins. Both clients see the merged result within 5s. Good enough for lunch.

**Storage.** All state lives in a single Netlify Blob keyed `current`. The whole state object (~5–20 KB) goes back and forth on each request. At our scale this is simpler than per-record CRUD; if the team grows past 30 or the state grows past ~100 KB, split it.

## File map

```
src/
  App.jsx           # main component, owns sync + auth state
  api.js            # client for /api/login, /api/state
  data.js           # seed data, default state, date helpers
  styles.css        # all CSS
  main.jsx          # entry point
  components/
    Gate.jsx        # passphrase + name picker
    Header.jsx      # brand + sync indicator + me chip
    Nav.jsx         # tabs
    UpcomingView.jsx
    SpotsView.jsx
    HistoryView.jsx

netlify/
  functions/
    login.js        # POST /api/login → token
    state.js        # GET/POST /api/state
```

# LunchSync

A real-time team lunch planner. RSVPs, restaurant voting, vibe polls, dietary compatibility, turn rotation, post-lunch ratings, and team profiles — all syncing across the whole team every 5 seconds via Netlify Blobs.

---

## Features

| Feature | Where |
|---|---|
| RSVP (yes / maybe / out) | Upcoming tab |
| Restaurant proposals & voting | Upcoming tab |
| Today's vibe poll (quick bite, adventurous, patio…) | Upcoming tab |
| 🎯 Whose turn to pick + 🎰 spin-to-decide | Upcoming tab |
| ⚠️ Dietary compatibility warnings | Upcoming + Spots tabs |
| Restaurant list with visit counts & ratings | Spots tab |
| Dietary accommodation tags per restaurant | Spots tab |
| 🔥 / 😐 / ❌ post-lunch ratings | History tab |
| Team membership (join / leave / create teams) | Profile tab |
| Dietary restriction tags per person | Profile tab |

---

## Running locally

### Prerequisites

- **Node.js 18+** — check with `node -v`
- **npm** — comes with Node
- **Netlify CLI** — needed to run the serverless function and Blobs emulator

```bash
npm install -g netlify-cli
```

### Steps

```bash
# 1. Clone the repo and enter the app directory
git clone https://github.com/floofman21/LunchSync.git
cd LunchSync/lunchsync-app\ 3

# 2. Install dependencies
npm install

# 3. Start the dev server
netlify dev
```

Open **http://localhost:8888** in your browser. Pick your name. That's it.

> **What `netlify dev` does:** it runs Vite (the React frontend on port 5173), the Netlify Function (`/api/state`), and an in-memory Blobs emulator — all behind a single proxy at port 8888. State resets when you stop the server unless you link to a real Netlify project (see below).

### Persistent state during local dev (optional)

If you want state to survive server restarts, link to a Netlify project once:

```bash
netlify login       # opens browser auth
netlify link        # link this directory to your Netlify site
netlify dev         # now uses the real remote Blobs store
```

### Frontend-only mode (no Netlify CLI)

If you just want to poke at the UI without the backend:

```bash
npx vite --port 5173
```

Open **http://localhost:5173**. API calls to `/api/state` will fail silently and the app will fall back to local seed data. Nothing persists and no sync happens, but every UI component is fully interactive.

---

## Deploying to Netlify

```bash
# 1. Push to GitHub (if you haven't)
git add . && git commit -m "ready" && git push

# 2. Go to https://app.netlify.com/start
#    → pick your repo
#    → build settings auto-detect from netlify.toml
#    → hit Deploy

# Takes ~60 seconds. Done.
```

No environment variables, no auth config. The deployed URL is the secret — share it with your team and they're in.

> Want to lock it down? Add an `Authorization` header check inside `netlify/functions/state.js` and set a `TEAM_SECRET` env var in Netlify's site settings.

---

## Architecture

**Why polling instead of WebSockets?**
Polling every 5 s is ~12 GET requests per active user per minute — well inside Netlify's free Functions tier (125k/month). For 8 people checking in during lunch planning, WebSockets would be overkill.

**Conflict resolution.**
Last-write-wins with a `version` counter. If two people RSVP simultaneously, whoever's POST lands second wins. Both clients see the merged result within 5 s. Good enough for lunch.

**Why one blob?**
All state lives in a single Netlify Blob keyed `"current"`. The whole object is ~5–30 KB. Simpler than per-record CRUD at this scale. If the team grows past ~30 people or state exceeds 100 KB, split lunches/restaurants/profiles into separate blobs.

**No accounts.**
Name selection is stored in `localStorage` only. The server never sees a user identity — RSVPs are just `{ [name]: 'yes' }` inside the shared state object. Works great for a trusted team; add a passphrase check in `state.js` if you ever share the URL more widely.

---

## State shape

```js
{
  version: number,          // incremented on every save (conflict detection)

  lunches: [{
    id,                     // "lunch_YYYY-MM-DD"
    date, time,
    restaurant,             // locked pick or null
    lockedBy,               // who locked it (for turn rotation)
    vibes,                  // { [person]: 'quick bite' | 'adventurous' | … }
    rsvps,                  // { [person]: 'yes' | 'no' | 'maybe' }
    proposedRestaurants,    // { [restaurantName]: [voters] }
    notes,
  }],

  restaurants: [{ name, addedBy }],

  teams: [{ id, name, emoji, members, createdBy }],

  ratings: {                // post-lunch ratings
    [lunchId]: { [person]: 'fire' | 'meh' | 'never' }
  },

  dietary: {                // per-person dietary restrictions
    [person]: string[]      // e.g. ['vegetarian', 'gluten-free']
  },

  restaurantTags: {         // dietary accommodations per restaurant
    [restaurantName]: string[]
  }
}
```

---

## File map

```
lunchsync-app 3/
├── index.html
├── vite.config.js
├── netlify.toml              # build + redirect config
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # state owner, all mutations, polling
│   ├── api.js                # fetchState / saveState / meStore
│   ├── data.js               # TEAM list, seed data, defaultState, date helpers
│   ├── styles.css            # full design system
│   └── components/
│       ├── Gate.jsx          # name picker
│       ├── Header.jsx        # brand bar + sync dot + me chip
│       ├── Nav.jsx           # tab navigation
│       ├── UpcomingView.jsx  # next lunch hero + vibe + rotation + future grid
│       ├── SpotsView.jsx     # restaurant list + ratings + dietary tags
│       ├── HistoryView.jsx   # past lunches + post-lunch ratings
│       └── ProfileView.jsx   # teams + dietary restrictions
└── netlify/
    └── functions/
        └── state.js          # GET/POST /api/state (Netlify Blobs)
```

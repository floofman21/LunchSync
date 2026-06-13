# LunchSync

A real-time team lunch planner for small teams. RSVPs, restaurant voting, vibe polls, dietary compatibility, turn rotation, post-lunch ratings, and team profiles — syncing across the whole team every 5 seconds.

Two versions of the app live in this repo:

| Version | Folder | Stack |
|---|---|---|
| Web | `lunchsync-app 3/` | React + Vite + Netlify Functions |
| Mobile (iOS & Android) | `lunchy-rn/` | React Native + Expo |

Both share the same backend API and data format.

---

## Features

| Feature | Tab |
|---|---|
| RSVP (yes / maybe / out) | Upcoming |
| Restaurant proposals & voting | Upcoming |
| Today's vibe poll (quick bite, adventurous, patio…) | Upcoming |
| 🎯 Whose turn to pick + 🎰 spin-to-decide | Upcoming |
| ⚠️ Dietary compatibility warnings | Upcoming + Spots |
| Restaurant list with visit counts & ratings | Spots |
| Dietary accommodation tags per restaurant | Spots |
| 🔥 / 😐 / ❌ post-lunch ratings | History |
| Team membership (join / leave / create) | Profile |
| Dietary restriction tags per person | Profile |

---

## Running the web version

### Prerequisites

- **Node.js 18+**
- **Netlify CLI** — `npm install -g netlify-cli`

### Steps

```bash
cd "lunchsync-app 3"
npm install
netlify dev
```

Open **http://localhost:8888**, pick a username, and you're in.

> `netlify dev` runs Vite (frontend), the Netlify Function (`/api/state`), and an in-memory Blobs store — all behind a single proxy at port 8888. State resets when you stop the server unless you link to a real Netlify project.

### Persistent state during local dev (optional)

```bash
netlify login    # opens browser auth
netlify link     # link to your Netlify site
netlify dev      # now syncs to the real remote Blobs store
```

### Frontend-only (no backend)

```bash
cd "lunchsync-app 3"
npx vite --port 5173
```

API calls fail silently; the app falls back to seed data. Nothing persists, but every UI component is interactive.

### Deploy to Netlify

Push to GitHub, then create a new site at [app.netlify.com](https://app.netlify.com/start) and point it at your repo. Build settings auto-detect from `netlify.toml`. No environment variables needed. Takes ~60 seconds.

---

## Running the mobile version (React Native / Expo)

### Prerequisites

- **Node.js 18+**
- **Expo CLI** — `npm install -g expo-cli` (or use `npx expo`)
- **Expo Go** app on your phone — [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) — for quick on-device testing
- Optionally: **Xcode** (iOS simulator, Mac only) or **Android Studio** (Android emulator)

### Steps

```bash
cd lunchy-rn
npm install
```

Before starting, open `src/config.js` and set `API_BASE` to wherever your backend is running:

```js
// src/config.js
export const API_BASE = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:3000',   // Android emulator → host machine localhost
      default: 'http://localhost:3000',   // iOS sim / Expo Go on same machine
    })
  : 'https://your-deployed-url.com';     // ← update for production
```

If you're running `netlify dev` on the same machine, the port is `8888`, so set it to `http://localhost:8888` (iOS sim) or `http://10.0.2.2:8888` (Android emulator).

Then start Expo:

```bash
npx expo start
```

You'll see a QR code in the terminal.

| How to test | What to do |
|---|---|
| **Physical phone** | Open Expo Go → scan the QR code |
| **iOS simulator** | Press `i` in the terminal (requires Xcode) |
| **Android emulator** | Press `a` in the terminal (requires Android Studio) |

### Building for the App Store / Play Store

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure (one-time)
eas login
eas build:configure

# Test builds
npx eas build --platform ios     --type simulator   # iOS .app
npx eas build --platform android --type apk          # Android .apk

# Store builds (requires Apple/Google developer accounts)
npx eas build --platform ios     --type archive
npx eas build --platform android --type app-bundle
```

---

## Rebranding

All brand-sensitive values are isolated to two files in `lunchy-rn/src/`:

**`src/branding.js`** — change app name, emoji, tagline, and footnote text:
```js
export const BRAND = {
  name: 'LunchSync',
  emoji: '🥪',
  tagline: 'team meals, finally sorted',
  subtitle: 'your team lunch planner',
  footNote: 'no account needed · username saved on your device',
};
```

**`src/theme.js`** — change the accent colour and full design system:
```js
export const COLORS = {
  cherry:      '#d63547',   // ← swap this to rebrand the accent colour
  cherryDark:  '#b52d3d',
  cherryLight: '#fce8eb',
  // ... all other tokens
};
```

No component files need to be touched for a full rebrand.

---

## Architecture

### Backend (shared by both versions)

- **Netlify Functions** — single serverless endpoint (`/api/state`)
- **Netlify Blobs** — KV store (free tier, no setup required)
- **Polling every 5 s** — simpler than WebSockets at this scale; well inside Netlify's free tier for small teams

### Conflict resolution

Last-write-wins with a `version` counter. If two people RSVP simultaneously, whoever's POST lands second wins. Both clients see the merged result within 5 s.

### No accounts

Username is stored in the browser (`localStorage`) or on the device (`AsyncStorage`). The server only sees `{ [name]: 'yes' }` inside the shared state object. Works perfectly for a trusted team.

---

## State shape

```js
// Registry (who's in which team)
{
  version: number,
  teams: [{ id, name, emoji, members: string[], createdBy, joinCode }]
}

// Team state (per team, keyed by team ID)
{
  version: number,
  teamId: string,

  lunches: [{
    id,                       // "lunch_YYYY-MM-DD_timestamp"
    date, time,
    restaurant,               // locked pick or null
    lockedBy,                 // who locked it (for turn rotation)
    vibes,                    // { [person]: 'quick bite' | 'adventurous' | … }
    rsvps,                    // { [person]: 'yes' | 'no' | 'maybe' }
    proposedRestaurants,      // { [restaurantName]: [voters] }
    notes,
  }],

  restaurants: [{ name, addedBy }],

  ratings: {                  // post-lunch ratings
    [lunchId]: { [person]: 'fire' | 'meh' | 'never' }
  },

  dietary: {                  // per-person restrictions
    [person]: string[]        // e.g. ['vegetarian', 'gluten-free']
  },

  restaurantTags: {           // accommodations per restaurant
    [restaurantName]: string[]
  }
}
```

---

## File map

```
LunchSync/
├── lunchsync-app 3/             Web version (React + Vite + Netlify)
│   ├── src/
│   │   ├── App.jsx              State hub, all mutations, polling
│   │   ├── api.js               fetch wrapper + localStorage store
│   │   ├── data.js              Seed data, defaults, date helpers
│   │   ├── styles.css           Full design system (CSS vars)
│   │   └── components/
│   │       ├── Gate.jsx
│   │       ├── Header.jsx
│   │       ├── Nav.jsx
│   │       ├── UpcomingView.jsx
│   │       ├── SpotsView.jsx
│   │       ├── HistoryView.jsx
│   │       └── ProfileView.jsx
│   └── netlify/functions/
│       └── state.js             GET/POST /api/state (Netlify Blobs)
│
└── lunchy-rn/                   Mobile version (React Native + Expo)
    ├── App.jsx                  Navigation root + context provider
    ├── app.json                 Expo config (name, icons, bundle IDs)
    └── src/
        ├── branding.js          App name, emoji, tagline ← rebrand here
        ├── theme.js             Colors, radii, shadows   ← rebrand here
        ├── config.js            API base URL (set before first run)
        ├── api.js               fetch wrapper + AsyncStorage store
        ├── data.js              Identical to web version
        ├── AppContext.jsx       All state + mutations via React Context
        ├── components/
        │   ├── Gate.jsx
        │   ├── AppHeader.jsx
        │   ├── UpcomingView.jsx
        │   ├── SpotsView.jsx
        │   ├── HistoryView.jsx
        │   └── ProfileView.jsx
        └── hooks/
            ├── useNotifications.js   Stub — permissions wired, scheduling TODO
            └── useContacts.js        Stub — ready for contact-invite feature
```

# LunchSync — Roadmap & Ideas

A living reference for planned work, feature ideas, and architecture upgrades.

---

## Auth & Identity

| Phase | What | Notes |
|---|---|---|
| **Current** | Username in `localStorage` | No uniqueness guarantee. Fine for a small trusted team. |
| **Phase 2** | Email magic link | User enters email → one-time link sent → click to log in. Email = unique ID. One Netlify Function + Resend/Postmark (free tier). ~1 weekend of work. **Recommended next step.** |
| **Phase 3** | Google / Apple SSO | OAuth via Clerk or Auth0 (generous free tiers). Profile pic, verified name, trusted sign-in button. Right move once you're onboarding people outside your immediate circle. |
| **Phase 4** | Phone number OTP | SMS verification via Twilio (~$0.01/SMS). Strongest uniqueness, works without email, ideal for a native mobile app. |

---

## Architecture

| Item | Status | Notes |
|---|---|---|
| Per-team Netlify Blobs | ✅ Done | Each team has its own isolated blob. Registry blob holds membership + join codes. |
| Company profile | Backlog | A parent "org" layer above teams. One company → many teams. Shared restaurant pool at the org level, team-specific lunches/history. Needs a new `orgs` registry blob and an org invite flow. |
| Per-team blob → database | Future | When team count or state size grows, swap Netlify Blobs for PlanetScale (MySQL) or Supabase (Postgres). The API layer (state.js) is the only thing that changes. |
| WebSockets / SSE | Future | Replace 5-second polling with real-time push. Worthwhile once you have 20+ concurrent users. Netlify doesn't support WebSockets natively — would move the function to a service that does (Railway, Fly.io, etc.). |

---

## Feature Backlog

### High priority
- **Unique username enforcement** — on the server, check that a chosen username isn't already taken in the team before allowing login
- **Push notifications** — remind team members to RSVP before the lunch; notify when a restaurant is locked in
- **Recurring lunch schedule** — instead of a fixed 26-entry seed, let the team admin configure frequency (weekly, every other week, etc.)
- **Admin role per team** — team creator gets extra powers: remove members, rename team, reset lunch schedule

### Medium priority
- **Team chat / comments** — a simple per-lunch comment thread so the team can discuss without leaving the app
- **Restaurant suggestions from Google Maps / Yelp** — type a restaurant name, get autofill from an API so you don't have to type the full name manually
- **Budget/price range filter** — tag each restaurant with a price range ($ / $$ / $$$) and filter the spin wheel to budget
- **Takeout vs dine-in mode** — toggle per lunch; affects which spots are shown and dietary compat checks
- **Photo from the lunch** — allow one team member to attach a photo to a past lunch entry (shows in History)
- **Waitlist / standby RSVP** — for teams that cap lunch at N people; "waitlist" status bumps you in if someone drops

### Lower priority / nice to have
- **Dark mode** — CSS variables are already set up, just needs a `prefers-color-scheme` media query pass
- **iCal / Google Calendar export** — one-click "add to calendar" for upcoming lunches
- **Slack / Teams integration** — post a daily 11am message: "Lunch today at Two Goose — Armand, Jay, Sara are in. RSVP here →"
- **Leaderboard** — who has picked the most lunches, who has the highest fire-rating average
- **Dietary compat score** — instead of a binary ⚠️, show a percentage score for how well a restaurant covers the team's needs
- **Multiple active teams shown together** — aggregate view across all your teams for people who are on several lunch crews

---

## Already shipped

| Feature | PR |
|---|---|
| Team profile area + membership tracking | #1 |
| Modernized design system | #2 |
| Post-lunch ratings (🔥/😐/❌) | #3 |
| Vibe voting (quick bite, adventurous, patio…) | #3 |
| Smart turn rotation + spin wheel | #3 |
| Dietary compatibility warnings | #3 |
| Open login (free-form username) | #3 |
| Team join codes + copy button | #3 |
| Teams are invite-code only (no public discovery) | #5 |
| New-user onboarding screen | #6 |
| All views scoped to team membership | #6 / #7 |
| Per-team Netlify Blobs (true data isolation) | #8 |
| Empty restaurant list per team | #9 |
| Active-team member scoping across all views | #9 |

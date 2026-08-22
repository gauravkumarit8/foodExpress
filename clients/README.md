# FoodExpress — Web & Mobile Apps

Companion apps for the [FoodExpress backend](https://github.com/gauravkumarit8/foodExpress)
(NestJS + PostgreSQL/PostGIS). This is an npm-workspaces monorepo:

```
foodexpress-apps/
├── packages/
│   └── api-client/     Shared, fully-typed API client (used by both apps below)
├── apps/
│   ├── web/             React + Vite + TypeScript + Tailwind — customer web app
│   └── mobile/           Expo + React Native + TypeScript — customer mobile app
```

Both apps talk to the backend through `@foodexpress/api-client`, so request
shapes, response types, and business rules (server-priced orders, the
`placed → accepted → preparing → ready → picked_up → delivered` status
machine, role gating) only need to be gotten right once. Also included: full
typed coverage of the restaurant-owner and rider endpoints, ready for phases 2
and 3 below — even though no UI uses them yet.

## Design system

Both apps share one visual identity, built around the idea of a kitchen order
ticket: warm paper background, a "ticket red" accent, Space Grotesk for
display type, IBM Plex Mono for order IDs/prices/timestamps (an authentic
nod to receipt printers), and a perforated **Order Ticket Rail** as the
signature tracking UI — order status shown as a stamped ticket rather than a
generic progress bar.

## Getting started

Requires Node 18+.

```bash
npm install                 # installs everything for both apps + the shared package
```

### Backend

Both apps expect the backend running locally at `http://localhost:3000/api/v1`
(the NestJS app's default). Clone and run
[foodExpress](https://github.com/gauravkumarit8/foodExpress) per its own
README before starting either app here.

### Web

```bash
cp apps/web/.env.example apps/web/.env
npm run web                 # → http://localhost:5173
```

### Mobile

```bash
npm run mobile               # → Expo dev server; scan the QR with Expo Go, or press i/a
```

Physical devices and emulators can't reach `localhost` — edit
`apps/mobile/src/config.ts` and point `API_BASE_URL` at your computer's LAN
IP (or `10.0.2.2` for the Android emulator specifically; that's the default
already set). If you're on a newer/older Expo SDK than what's pinned in
`apps/mobile/package.json`, run `npx expo install --fix` after installing to
align versions automatically.

## What's built

**Phase 1 — Customer app (web + mobile).**
- Register / log in (JWT, stored in `localStorage` on web and
  `expo-secure-store` on mobile)
- Browse restaurants, sorted by distance when location permission is granted
- Restaurant detail + menu, grouped by category
- Cart (single-restaurant at a time — switching restaurants prompts to clear)
- Checkout with delivery address, live location, and instructions
- Live order tracking (polls every 6s) with the Order Ticket Rail
- Order history
- Post-delivery rating
- Profile

**Phase 2 — Restaurant owner dashboard (web only, at `/owner`).**
- `/owner` — list of restaurants you own, or a prompt to create your first one
- `/owner/new` — create a restaurant (name, description, city, address,
  lat/lng — with a "use my current location" shortcut, image URL)
- `/owner/restaurants/:id` — per-restaurant dashboard with two tabs:
  - **Incoming orders** — every order for that restaurant, with action
    buttons that exactly match the backend's allowed transitions: `placed`
    → *Accept* or *Cancel*; `accepted` → *Start preparing* or *Cancel*;
    `preparing` → *Mark ready* or *Cancel*; `ready` → *Cancel* only (pickup
    is rider-driven from here, via the delivery endpoints)
  - **Menu** — add items, edit price inline, toggle availability
  - An Open/Closed toggle for the restaurant itself
- The nav bar and profile page link owners straight to `/owner`

## Roadmap

**Phase 3 — Rider delivery app (mobile).** Not yet built. Riders are
mobile-first, so this belongs in `apps/mobile`, not web. The API client
already has `delivery.registerAsRider`, `delivery.setMyAvailability`,
`delivery.myAssignments`, `delivery.markPickedUp`, and `delivery.markDelivered`
typed and ready — this phase is almost entirely new screens, not new
plumbing. Needed: an availability toggle, an assignment list, and
pickup/delivered actions — plus a map view if you want turn-by-turn framing,
which would be a new addition (nothing in the backend currently returns
directions, only lat/lng).

## Known gaps in the backend itself

Carried over from the FoodExpress repo, worth knowing about before you build
on top of it:

- **Payments** — entities and idempotency scaffolding exist, but the actual
  payment-provider call (Stripe/Razorpay/etc.) is still a stub.
- **Delivery assignment** is manual/admin-driven in this MVP — there's no
  auto-dispatch to the nearest available rider yet.

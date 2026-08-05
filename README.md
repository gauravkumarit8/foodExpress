# FoodExpress backend

MVP backend for the FoodExpress food delivery app — a modular monolith built with NestJS,
following `food-delivery-architecture-design.md` and `food-delivery-prd.md`.

This has been built, compiled, and smoke-tested end-to-end (register → login → JWT-protected
routes → Postgres) before being handed to you — it's a working skeleton, not just scaffolding.

## Prerequisites

- Node.js 20+
- Docker (for the local Postgres/PostGIS database)

## Developing in GitHub Codespaces

This repo includes a `.devcontainer/devcontainer.json`, so "Code → Create codespace on main"
gives you Node 20 and Docker-in-Docker preconfigured, and runs `npm install` automatically.
Once the Codespace is ready, just run the same setup commands below — `docker-compose up -d db`
works inside Codespaces the same way it does locally. Port 3000 auto-forwards.

## Setup

```bash
cp .env.example .env
docker-compose up -d db
npm install
npm run start:dev
```

The API will be running at `http://localhost:3000/api/v1`.

## Try it

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the returned accessToken on protected routes
curl http://localhost:3000/api/v1/auth/me -H "Authorization: Bearer <token>"
```

## What's implemented vs. stubbed

| Module | Status |
|---|---|
| **Users / Auth** | Fully working: register, login, JWT issuance, protected-route guard, password hashing |
| **Restaurants** | Full CRUD skeleton: create restaurant, list open restaurants, get menu. Geo-radius filtering (PostGIS `ST_DWithin`) is a `TODO` in `restaurants.service.ts` — fine to defer until you have enough restaurants for distance to matter |
| **Orders** | Full order-placement flow + status state machine (`placed → accepted → preparing → ready → picked_up → delivered`, illegal transitions rejected). Payment integration point is marked with a comment in `orders.service.ts` |
| **Payments** | Entity + idempotency-key logic in place; actual Stripe/Razorpay call is a stub (`payments.service.ts`) pending the provider decision flagged in the PRD |
| **Delivery** | Manual rider assignment (per MVP scope) — list available riders, assign, mark picked up/delivered |

None of the "explicitly out of scope" items from the PRD are here yet (auto-dispatch, live GPS tracking, ML ETA, multi-city) — that's intentional, see the PRD §5 and the architecture doc's scaling roadmap (§11) for when to add each one.

## Project structure

```
src/
├── main.ts                 # bootstrap, global pipes/filters/interceptors
├── app.module.ts            # wires all 5 modules + TypeORM
├── config/                  # environment config
├── common/                  # health check, exception filter, logging interceptor
└── modules/
    ├── users/                # auth + user accounts
    │   └── auth/              # JWT strategy, guard, login/register
    ├── restaurants/          # restaurant + menu CRUD
    ├── orders/                # cart→order, status state machine
    ├── payments/              # charge/refund, idempotency
    └── delivery/              # riders, manual assignment
```

Each module owns its own entities and only talks to others via HTTP/DI boundaries —
no module reaches into another's database tables directly. That's the one rule that
keeps a future extraction into separate services (per the scaling roadmap) a clean cut
instead of a rewrite.

## Database

`synchronize: true` is on for local dev (auto-creates tables from entities). Before this
goes anywhere near production, switch to real TypeORM migrations under `src/database/migrations`
and set `synchronize: false` — auto-sync against a live database is a good way to lose data.

## Known gotchas to be aware of

- **Decimal columns** (`price`, `subtotal`, `total`, etc.) come back from `pg` as strings, not
  numbers, unless you add a TypeORM column transformer. Not fixed here to keep this skeleton
  focused — worth doing before you build real pricing logic on top of it.
- **Delivery fee** is a flat placeholder (`orders.service.ts`) — replace with real logic once
  you've decided flat vs. distance-based pricing (PRD open question).
- **Restaurant/menu-item ownership** isn't yet checked against the logged-in user on the
  `PATCH` routes — fine for a single-admin MVP, worth adding once restaurant owners self-manage.

## Next steps

1. Decide the two open questions from the PRD (payment provider, delivery fee model) and wire
   `payments.service.ts` up to the real provider.
2. Build the admin dashboard (or even just Postman/Insomnia collection) for onboarding the first
   restaurants and riders manually.
3. Start the customer-facing frontend (React PWA) against this API.

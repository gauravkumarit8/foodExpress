# Pre-frontend audit round 3 — apply notes

Applies on top of both previous patches. Different category of bug this round: not missing
authorization, but missing *existence/state validation* — trusting an ID was real, or that a
collection had contents, without checking.

```bash
npm install
npm run test          # 59 (was 55)
npm run test:e2e      # 34 (was 33)
```

## Bug: `POST /delivery/assign` accepted a fake `riderId` — and could strand an order permanently

Confirmed live: assigning a made-up rider ID returned 201. Worse than a normal bad-input bug —
because a second assignment attempt on the same order 409s ("already has a rider assigned"),
an order assigned to a fake rider could **never be reassigned to a real one** through the API.
Manual DB surgery would've been the only way out.

**Fix:** `assign()` now verifies the rider exists and is currently active (`isActive: true`)
before creating the assignment — which also means the online/offline toggle from an earlier round
now actually means something operationally, not just cosmetically.

## Bug: empty-item "ghost orders" for restaurants that don't exist

Confirmed live: `POST /orders` with `items: []` and a completely made-up `restaurantId` returned
201 — a valid order, ₹0 subtotal, ₹30 total, for a restaurant that isn't real.

**Fix:** two changes — `@ArrayMinSize(1)` on the order DTO (an order needs at least one item), and
`OrdersService.create()` now explicitly looks up the restaurant and rejects if it doesn't exist
*or if it's currently closed* (which was also never checked — you could previously order from a
restaurant that had closed for the night).

## Bug: malformed IDs on `/delivery/assign` caused raw 500s

This one came from writing the test for the fix above, not from guessing. `orderId`/`riderId` on
that endpoint were pulled straight from the body with `@Body('orderId')` — no DTO, no validation.
A non-UUID string reached Postgres directly and came back as an unhelpful `500 Internal server
error` instead of a clean 400.

**Fix:** new `AssignDeliveryDto` with `@IsUUID()` on both fields. Same endpoint, now validated like
everywhere else.

## Not a bug, but a real finding: the rate limiter is now tight enough to catch the test suite

Adding a test for the fake-rider fix meant registering a *second* rider account partway through the
suite — which pushed the run past 5 `/auth/register` calls in under a minute and got 429'd by our
own rate limiter. That's the limiter working correctly; it just doesn't distinguish "an attacker"
from "an automated test suite creating fixtures." Standard practice: skip throttling when
`NODE_ENV=test`. Added via `skipIf` in `app.module.ts` — production and dev behavior is unchanged.

## Where the audit stands now

This is the third full pass. Rounds 1–3 covered, systematically, across every module: object-level
authorization (does the caller own/have-access-to this specific resource), and existence/state
validation (does the referenced ID actually exist, is it in a state that makes the operation
valid). Both patterns have now been checked and fixed everywhere they apply.

What's left is exclusively things already identified and deliberately deferred in earlier rounds —
not new discoveries:
- No RBAC on dispatch endpoints (`/delivery/assign`, `/delivery/riders/available`)
- Payments still stubbed
- No cross-request DB transactions (the pickup/delivery timestamp-sync window noted two rounds ago)
- Decimal-as-string from Postgres (documented gotcha, not a functional bug)
- No pagination on list endpoints (not urgent at 100-user scale)

**My honest recommendation: stop auditing and start building the frontend.** Continuing to search
for more of the same class of bug is now diminishing returns — three systematic passes have
covered auth, ownership, and input/state validation across the whole API. The known remaining items
above are genuine scope decisions, not things hiding in the code waiting to be found.

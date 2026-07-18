# Relay architecture

## Goals

Build a peer-to-peer local delivery marketplace where:

- Customers request deliveries without owning a fleet
- Drivers discover and accept nearby jobs
- Status is visible end-to-end

Non-goals for this MVP: payments settlement, native mobile, multi-city ops tooling, fraud systems.

## Bounded contexts

1. **Identity** — users, roles, sessions
2. **Supply** — driver presence + last-known location
3. **Demand** — delivery requests and lifecycle
4. **Matching** — geospatial proximity filter + ranking
5. **Tracking** — immutable event log per delivery

## Data model (simplified)

- `User` (`CUSTOMER` | `DRIVER`)
- `DriverProfile` (`isOnline`, `lat`, `lng`, vehicle, rating)
- `Delivery` (pickup/dropoff geo + addresses, fare, status, parties)
- `DeliveryEvent` (append-only status history)

### Status machine

```text
PENDING → ACCEPTED → PICKED_UP → IN_TRANSIT → DELIVERED
   │          │
   └──── CANCELLED ←┘
```

Invalid transitions are rejected server-side (`canTransition`).

## Matching algorithm (MVP)

1. Driver must be online with a known location
2. Load recent `PENDING` deliveries
3. Compute Haversine distance from driver → pickup
4. Keep jobs within `radiusKm` (default **8**)
5. Sort ascending by distance to pickup

Future upgrades:

- Geo index / PostGIS `ST_DWithin`
- Score = distance + ETA + driver rating + package fit
- Push notify top-N drivers; claim token to prevent double-accept

## API surface

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create account |
| POST | `/api/auth/login` | public | Session cookie |
| POST | `/api/auth/logout` | auth | Clear cookie |
| GET | `/api/auth/me` | auth | Current user + driver profile |
| GET/POST | `/api/deliveries` | customer/driver | List / create |
| GET | `/api/deliveries/:id` | party / drivers (pending) | Detail |
| POST | `/api/deliveries/:id/accept` | driver | Claim job |
| PATCH | `/api/deliveries/:id/status` | driver/customer | Advance or cancel |
| POST/PATCH | `/api/drivers/location` | driver | Location / online flag |
| GET | `/api/drivers/jobs` | driver | Nearby open jobs |

## Concurrency

Accept uses a transaction:

1. Re-read delivery; require `PENDING`
2. Ensure driver has no other active job
3. Assign driver + write `ACCEPTED` event

This prevents two drivers from claiming the same request under normal load. For high contention, add `UPDATE ... WHERE status = 'PENDING'` row locks or a claim token table.

## Realtime strategy

MVP uses polling so the app runs on a single Next.js process with SQLite.

Recommended progression:

1. **SSE** channel per user for delivery updates
2. **Redis pub/sub** when scaling to multiple nodes
3. **WebSockets** if bidirectional chat / live GPS streams are required

## Suggested production stack evolution

| Concern | MVP | Production |
|---|---|---|
| Database | SQLite | Postgres + PostGIS |
| Auth | JWT cookie | Same + OAuth / magic link |
| Files / media | — | S3-compatible package photos |
| Payments | offer amount only | Stripe Connect |
| Maps | OSM + demo pins | Mapbox/Google + device GPS |
| Hosting | `next start` | Vercel/Fly + managed Postgres |
| Observability | logs | OpenTelemetry + error tracking |

## Security notes

- Passwords hashed with bcrypt
- Session JWT in httpOnly cookie
- Role checks on every mutating route
- Never trust client-computed fare/distance for settlement (recompute server-side — already done on create)

## Step-by-step build order (used in this repo)

1. Domain schema + migrations
2. Auth (register/login/session)
3. Delivery create + list
4. Driver location + nearby jobs
5. Accept + status transitions + events
6. Customer/driver UI + map
7. Seed demo data
8. Harden matching, payments, push (next phase)

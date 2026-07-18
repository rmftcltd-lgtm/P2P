# Lonelyseat architecture

## Goals

Rebuild Lonelyseat as a peer-to-peer delivery marketplace where:

- **Senders** list stuff (space needed, pickup/dropoff, timing)
- **Drivers** list journeys (one-way / day trip / multiple lonely seats)
- Either side can discover the other; status is visible end-to-end

Tutorial mapping: [`docs/LONELYSEAT_VIDEOS.md`](LONELYSEAT_VIDEOS.md).

Non-goals for this MVP: full Stripe Connect payouts, native mobile shipping, multi-city ops tooling, fraud systems.

## Bounded contexts

1. **Identity** — users, roles, sessions
2. **Supply** — driver presence + **DriverTrip** lonely-seat listings
3. **Demand** — delivery requests and lifecycle
4. **Matching** — geospatial proximity + optional trip attachment
5. **Tracking** — immutable event log + drop-off photo proof

## Data model (simplified)

- `User` (`CUSTOMER` | `DRIVER`) — sender / driver
- `DriverProfile` (`isOnline`, geo, vehicle, rating, **kycStatus**)
- `DriverTrip` (one-way / day-trip / multi legs, spaces, vehicle, `batchId`)
- `Delivery` (route, fare, status, **paymentStatus**, optional `tripId`, Lonely Cover, drop-off photo)
- `DeliveryEvent` (append-only status history)
- `Rating` (customer → driver after delivery)

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
| GET/POST | `/api/auth/*` | public/auth | register, login, logout, me, **token** |
| GET/POST | `/api/deliveries` | customer/driver | List / create |
| GET | `/api/deliveries/:id` | party / drivers (pending) | Detail |
| POST | `/api/deliveries/:id/accept` | driver | Claim job |
| PATCH | `/api/deliveries/:id/status` | driver/customer | Advance or cancel |
| POST | `/api/deliveries/:id/pay` | customer | Authorize payment |
| POST | `/api/deliveries/:id/rate` | customer | Rate driver |
| POST/PATCH | `/api/drivers/location` | driver | Location / online flag |
| GET/POST | `/api/drivers/kyc` | driver | Verification |
| GET | `/api/drivers/jobs` | driver | Nearby open jobs |
| GET | `/api/places/search` | auth | Nominatim geocode |
| GET | `/api/stream` | auth | SSE live events |
| GET/POST | `/api/trips` | sender browse / driver create | Lonely-seat journey listings |
| GET | `/api/browse/drivers` | public | Browse empty space (wireframe search) |
| GET | `/api/browse/stuff` | public | Stuff listings for drivers |
| GET/POST | `/api/offers` | auth | Bidirectional booking offers |
| POST | `/api/offers/:id/respond` | recipient | Accept (auto-rejects siblings) / reject |
| GET/POST | `/api/deliveries/:id/messages` | party | Inbox thread + chat |
| POST/PATCH | `/api/deliveries/:id/cancel` | party | Mutual / forced cancellation |
| GET | `/api/deliveries/:id/invoice` | party | Invoices after drop-off photo |
| GET | `/api/estimate` | public | Get An Estimate |

## Concurrency

Accept uses a transaction:

1. Re-read delivery; require `PENDING`
2. Ensure driver has no other active job
3. Assign driver + write `ACCEPTED` event

This prevents two drivers from claiming the same request under normal load. For high contention, add `UPDATE ... WHERE status = 'PENDING'` row locks or a claim token table.

## Realtime strategy

Single-node **SSE** at `GET /api/stream?topics=user,jobs` pushes `delivery.created` / `delivery.updated` events.
UI still keeps a slow polling fallback. Scale-out: move `src/lib/events.ts` to Redis pub/sub.

## Database

- **Default:** SQLite (`DATABASE_URL=file:./dev.db`) for zero-ops local MVP
- **Production path:** `docker compose up` starts PostGIS 16; see `web/src/lib/matching-postgis.sql` for `ST_DWithin` matching
- Switch Prisma `datasource.provider` to `postgresql` and install `@prisma/adapter-pg` before pointing at Postgres

## Payments

- `POST /api/deliveries/:id/pay` creates a PaymentIntent (or mock `pi_mock_*` when `STRIPE_SECRET_KEY` is unset)
- Capture runs automatically when status becomes `DELIVERED`

## KYC & ratings

- Drivers submit KYC via `POST /api/drivers/kyc` (demo auto-approves)
- Unverified/rejected drivers cannot accept jobs
- Customers rate drivers after delivery; rating average rolls into `DriverProfile.rating`

## Mobile

- Bearer tokens from `POST /api/auth/token`
- Contract: `docs/MOBILE_API.md`
- Expo starter: `mobile/`

## Suggested production stack evolution

| Concern | Now | Next |
|---|---|---|
| Database | SQLite | Managed Postgres + PostGIS indexes |
| Realtime | In-memory SSE | Redis-backed SSE/WebSockets |
| Payments | Mock / Stripe PI | Stripe Connect payouts to drivers |
| KYC | Demo auto-approve | Stripe Identity / manual review queue |
| Maps | Nominatim + GPS | Mapbox/Google Places + turn-by-turn |

## Security notes

- Passwords hashed with bcrypt
- Session JWT in httpOnly cookie **or** `Authorization: Bearer`
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
8. Postgres/PostGIS path, SSE, places/GPS, payments, KYC/ratings, mobile API + Expo starter

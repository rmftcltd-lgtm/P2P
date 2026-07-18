# Relay — Peer-to-Peer Delivery Platform

Local deliveries matched to nearby drivers. This repo contains the architecture plan and a working MVP in `web/`.

## Product in one sentence

Customers publish a pickup → dropoff request; online drivers within a radius see and accept jobs; both sides track status from request to delivery.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App framework | **Next.js 16 (App Router) + TypeScript** | One codebase for UI + API, fast iteration |
| UI | **React 19 + Tailwind CSS 4** | Component-driven product UI |
| Maps | **Leaflet / react-leaflet + OSM tiles** | Free map tiles for MVP demos |
| ORM / DB | **Prisma 7 + SQLite** | Zero-ops local DB; swap URL to Postgres for prod |
| Auth | **JWT in httpOnly cookie (jose + bcrypt)** | Simple role-aware sessions (CUSTOMER / DRIVER) |
| Validation | **Zod** | Shared request schemas |
| Realtime (MVP) | **Short polling (4–5s)** | Reliable without a separate socket server |

## High-level architecture

```text
┌──────────────┐     ┌──────────────┐
│  Customer UI │     │   Driver UI  │
│ /customer    │     │   /driver    │
└──────┬───────┘     └──────┬───────┘
       │ REST JSON          │ REST JSON
       └─────────┬──────────┘
                 ▼
        ┌────────────────┐
        │ Next.js API    │
        │ /api/auth/*    │
        │ /api/deliveries│
        │ /api/drivers/* │
        └────────┬───────┘
                 ▼
        ┌────────────────┐
        │ Matching + Geo │
        │ Haversine km   │
        │ Fare estimate  │
        └────────┬───────┘
                 ▼
        ┌────────────────┐
        │ Prisma + SQLite│
        │ Users/Drivers  │
        │ Deliveries     │
        │ Events         │
        └────────────────┘
```

## Core domain flow

1. **Register / login** as `CUSTOMER` or `DRIVER`
2. **Customer** creates a delivery (pickup, dropoff, size) → status `PENDING`
3. **Driver** sets location, goes online → lists nearby `PENDING` jobs (default 8 km)
4. **Driver** accepts → `ACCEPTED` (one active job at a time)
5. Driver advances → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`
6. Either party may `CANCEL` while `PENDING` or `ACCEPTED`
7. Every transition appends a **DeliveryEvent** for the timeline

## Project layout

```text
web/
  prisma/schema.prisma   # data model
  prisma/seed.ts         # demo users + open job
  src/app/api/           # REST endpoints
  src/app/customer/      # request + track
  src/app/driver/        # radio + active hop
  src/lib/               # auth, geo, matching
  src/components/        # map, badges, header
docs/ARCHITECTURE.md     # deeper design notes
```

## Quick start

```bash
cd web
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo accounts** (after seed):

- Customer: `customer@relay.test` / `password123`
- Driver: `driver@relay.test` / `password123`

## Production path (next steps)

- Swap SQLite → Postgres (`DATABASE_URL`)
- Add WebSockets / SSE for push matching
- Replace demo place pickers with Places autocomplete + GPS
- Payments (Stripe Connect), KYC for drivers, ratings
- Mobile apps (React Native) on the same API

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for components, APIs, and scaling notes.

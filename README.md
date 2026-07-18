# Relay — Peer-to-Peer Delivery Platform

Local deliveries matched to nearby drivers. Architecture docs + working web MVP + Expo mobile starter.

## Product in one sentence

Customers publish a pickup → dropoff request; online drivers within a radius see and accept jobs; both sides track status from request to delivery.

## Tech stack

| Layer | Choice |
|---|---|
| Web app | Next.js 16 + TypeScript + Tailwind |
| Mobile | Expo (React Native) in `mobile/` |
| DB | Prisma 7 + SQLite (default) · Postgres/PostGIS via `docker-compose.yml` |
| Auth | JWT cookie (web) + Bearer token (mobile) |
| Maps / places | Leaflet + Nominatim + device GPS |
| Realtime | SSE (`/api/stream`) + light polling fallback |
| Payments | Stripe PaymentIntents (mock mode without keys) |

## Architecture

```text
Customer / Driver (web or mobile)
        │  REST + SSE + Bearer/cookie
        ▼
   Next.js API  ── matching (Haversine / PostGIS SQL ready)
        ▼
   Prisma → SQLite or Postgres
```

See `docs/ARCHITECTURE.md` and `docs/MOBILE_API.md`.

## Step-by-step features (built)

1. Core request → match → deliver MVP
2. Postgres/PostGIS path (`docker-compose.yml`, PostGIS SQL helper)
3. SSE live job/status updates
4. Real address search + GPS pins
5. Stripe authorize/capture scaffolding (mock without keys)
6. Driver KYC gate + customer ratings
7. Mobile Expo client on the same API

## Quick start (web)

```bash
cd web
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Demo: `customer@relay.test` / `driver@relay.test` · password `password123`

### Optional Postgres

```bash
docker compose up -d
# then switch prisma provider to postgresql + DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
```

### Mobile

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

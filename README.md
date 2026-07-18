# Lonelyseat — Peer-to-Peer Delivery for Aotearoa

Rebuild of the Lonelyseat.co.nz thesis: match stuff Kiwis need to send with drivers already heading that way.

Research recovered from the offline site (Wayback + press) lives in [`docs/LONELYSEAT_RESEARCH.md`](docs/LONELYSEAT_RESEARCH.md).

## Product in one sentence

**Lonelyseat matches people wanting to send stuff with people heading that way** — fill the lonely seat, save ~50% vs courier, cut empty-car carbon.

## Tech stack

| Layer | Choice |
|---|---|
| Web | Next.js 16 + TypeScript + Tailwind |
| Mobile | Expo starter in `mobile/` |
| DB | Prisma + SQLite (default) · PostGIS via `docker-compose.yml` |
| Auth | JWT cookie (web) + Bearer token (mobile) |
| Maps | Leaflet + Nominatim + GPS |
| Realtime | SSE + light polling |
| Payments | Stripe / mock escrow capture on deliver |

## Quick start

```bash
cd web
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Demo logins:

- Sender: `sender@lonelyseat.test` / `password123`
- Driver: `driver@lonelyseat.test` / `password123`

## Lonelyseat features carried into this rebuild

- Sender / Driver CTAs and NZ corridor places
- Driver journey listings: **one-way / day trip / multiple** (`/driver/trips`)
- Space types (shoebox → trailer) + optional Lonely Cover ($5 / $2k)
- Drop-off photo proof on deliver
- 50 km route radius (archive `DRIVE_ROUTE_RADIUS`)
- NZD pricing guidance calibrated to AKL→CHC chair example
- Licence KYC, escrow-style authorize/capture, ratings

Video tutorial mapping: `docs/LONELYSEAT_VIDEOS.md`  
Archive research: `docs/LONELYSEAT_RESEARCH.md`

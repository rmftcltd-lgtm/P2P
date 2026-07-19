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

- Admin: `admin@lonelyseat.test` / `password123` → `/admin/login`
- Sender: `sender@lonelyseat.test` / `password123`
- Driver: `driver@lonelyseat.test` / `password123`

Admin dashboard (`/admin`): manage users, orders, driver/stuff listings, editable labels (time / space / ride), CMS pages, incomplete registrations, and user feedback.

## Lonelyseat features carried into this rebuild

- Home dual CTAs: **Search Stuff** / **Search Drivers** (mobile wireframe)
- Browse empty space + stuff listings with sort/space/date filters
- Bidirectional offers + auto-reject siblings on accept
- Inbox threads (system events + chat + photo URLs)
- Mutual vs forced cancellation; invoices after drop-off photo
- **Stripe payments + Connect payouts** (mock without keys)
- **Email (Resend) + SMS (Twilio)** on register/offer/pay/status/cancel
- Sender / Driver CTAs and NZ journey places
- Driver journey listings: **one-way / day trip / multiple** (`/driver/trips`)
- Space types (shoebox → trailer) + optional Lonely Cover ($5 / $2k)
- Drop-off + pickup photo proof
- Get An Estimate + optional partner donations (1%)
- 50 km route radius (archive `DRIVE_ROUTE_RADIUS`)
- NZD pricing guidance calibrated to AKL→CHC chair example
- Licence KYC, escrow-style authorize/capture, ratings

Live demo: https://lonelyseat.vercel.app  
Payments & messaging setup: `docs/PAYMENTS_AND_MESSAGING.md`  
Wireframe audit: `docs/LONELYSEAT_WIREFRAMES.md`  
Video tutorial mapping: `docs/LONELYSEAT_VIDEOS.md`  
Archive research: `docs/LONELYSEAT_RESEARCH.md`  
Hosting: `docs/HOSTING.md`

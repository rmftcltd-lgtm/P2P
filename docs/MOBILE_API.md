# Relay Mobile API Contract

Base URL: `http://localhost:3000` (or your deployed host)

Auth: session cookie `relay_session` (web) **or** `Authorization: Bearer <token>` (mobile — see `/api/auth/token`).

## Endpoints used by mobile

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password, name, role, vehicleType? }` |
| POST | `/api/auth/login` | returns user; sets cookie |
| POST | `/api/auth/token` | returns `{ token, user }` for Bearer auth |
| GET | `/api/auth/me` | current user |
| GET/POST | `/api/deliveries` | list / create |
| GET | `/api/deliveries/:id` | detail + events + rating |
| POST | `/api/deliveries/:id/accept` | driver claim |
| PATCH | `/api/deliveries/:id/status` | lifecycle |
| POST | `/api/deliveries/:id/pay` | authorize payment (mock or Stripe) |
| POST | `/api/deliveries/:id/rate` | 1–5 stars |
| POST/PATCH | `/api/drivers/location` | GPS + online |
| GET | `/api/drivers/jobs` | nearby pending |
| GET/POST | `/api/drivers/kyc` | verification |
| GET | `/api/places/search?q=` | Nominatim geocode |
| GET | `/api/stream?topics=user,jobs` | SSE live updates |

## Status machine

`PENDING → ACCEPTED → PICKED_UP → IN_TRANSIT → DELIVERED` (+ `CANCELLED` from PENDING/ACCEPTED)

## Mobile starter

See `/mobile` Expo app — points at `EXPO_PUBLIC_API_URL`.

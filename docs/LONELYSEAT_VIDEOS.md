# Lonelyseat video tutorial logic

YouTube channel: [@lonelyseat725](https://www.youtube.com/@lonelyseat725) (RMFTCLTD)

> Note: This cloud environment could not stream/download the videos (YouTube bot/IP block). Logic below is reconstructed from **oEmbed titles**, archived lonelyseat.co.nz How-it-works copy, and the product flows those tutorials demonstrate.

## Videos mapped

| ID | Title | Product logic |
|---|---|---|
| `OO79Rltni28` | Signing up as a Driver | Register as driver → licence / roadworthiness → Stripe payout readiness |
| `3yXkjHEK_hA` | Signing up as a Sender | Register as sender → community safety details |
| `TwNNUfnx4bU` | Create a Driver listing (**One-way**) | Single from→to trip + date/time + spaces + vehicle |
| `_zBpJ84bHKk` | Create a Driver Listing (**Day Trip**) | Outbound + same-day return window |
| `iMcgXSsdBAI` | Create Driver Listings (**Multiple**) | Batch several legs/dates in one listing session |
| `CH7-BwGzXE0` | List an Item for Delivery | Sender posts item, space needed, pickup/dropoff, timing |

## Marketplace model (two-sided listings)

Lonelyseat is **not** only “nearby drivers browse open jobs”. Tutorials show:

1. **Drivers list journeys** (lonely seats) — one-way / day trip / multiple
2. **Senders list stuff** — item + space + journey + timing
3. Either side can discover the other; accept/decline; then pickup → deliver → review → payout

## Driver listing fields (from How-it-works + titles)

- Vehicle type
- Spaces available: shoebox, frontseat, backseat, boot (sedan/hatch/other), trailer
- From → To
- Day(s) / time(s)
- Trip type: `ONE_WAY` | `DAY_TRIP` | `MULTI`
- MULTI uses a shared `batchId` across legs

## Sender item fields

- What it is / notes
- Space needed
- Pickup & dropoff
- Preferred day/time
- Optional **Lonely Cover** ($5 / up to $2000)

## Trust steps called out in original flows

- Licence + attestation (KYC)
- Escrow until complete
- Live tracking + drop-off photo
- Two-way reviews

## Implemented in this rebuild

- `DriverTrip` model + `/driver/trips` UI for one-way / day-trip / multi
- Sender browse trips + list item with space keys + Lonely Cover
- Delivery can attach to a trip; drop-off photo URL on deliver
- Docs + seed examples for NZ journeys

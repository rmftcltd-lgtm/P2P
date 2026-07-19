# Lonelyseat mobile wireframe audit

Source: `docs/lonelyseat-wireframes.pdf` (81 screens) + samples in `docs/wireframe-samples/`.

## Marketplace model in the wireframes

Two discovery paths (home: **Search Stuff** / **Search Drivers**):

1. **Browse Empty Space** — sender searches origin → destination → space fit → date/time → driver list → detail → **Send request** (item + pay) → driver accept/reject → chat
2. **Stuff Listing** — driver searches a journey → item list → detail → **Book / offer** → sender accept/reject → chat

Shared shells: hamburger (SEND / DRIVE / Help / Contact / Estimate), notifications → Inbox, bottom nav Home / Inbox / Stuff / Drive.

## Screen inventory (condensed)

| Area | Screens | Core logic |
|---|---|---|
| Home | 1 | Dual CTAs Search Stuff / Search Drivers |
| Browse empty space | 2–11 | Location, destination, space taxonomy, sort, date filters, map toggle |
| Driver results/detail | 12–19 | Ratings, favorites, price, **Send request** |
| Request + pay | 20–24 | Item dims, auto price, Stripe, optional charity %, owner-risk disclaimer |
| Request thread | 25–34 | Request ID, system + chat messages, camera |
| Map search | 35–39 | Pins; tap shows from→to route |
| Stuff listings | 40–44 | Space fit, price, map; liability flags; Book / Add to cart |
| Booking dates | 45–49 | Calendar for travel day |
| Sender inbox | 50–59 | Color by initiator; accept/reject; auto-reject sibling offers |
| Cancellation | 60–64 | **Mutual** (other party decides) vs **Forced (no refund)** |
| Driver inbox | 65–74 | Same chat model; arrival / pickup / photo in feed |
| Drop-off + invoices | 75–81 | Drop-off camera; invoices after photo proof |

## Gap vs rebuild (before this pass)

| Wireframe | Was missing / weak | Now |
|---|---|---|
| Browse empty space + map | Trips existed; no search UI | `/browse/drivers` |
| Stuff listing search | Nearby radius only | `/browse/stuff` journey search |
| Send request to a trip | Optional `tripId` only | Offer + request flow |
| Multi-offer accept | Direct claim only | `DeliveryOffer` + auto-reject siblings |
| Inbox / chat + system feed | Events only | `/inbox` + messages API |
| Mutual / forced cancel | Simple cancel | Cancel modes + refund rules |
| Estimate | None | `/estimate` |
| Liability flags | None | packaging / greet fields |
| Invoices after drop-off photo | None | invoice JSON after delivered+photo |
| Charity 1% partners | None | optional donation flags on pay |
| Cart of many bookings | None | **Skipped** — multi-trip listing + multiple deliveries is clearer on web |

## Improvements we keep over the wireframe

- Server-computed fare + escrow authorize/capture (not only a static listing price)
- Explicit status machine + KYC gate before accept
- Lonely Cover ($5 / $2k) instead of blank “Insurance $0”
- Day-trip / multi lonely-seat listings from tutorials
- SSE live updates (better than poll-only inbox)
- Drop-off **and** pickup photo URLs in the event/message feed
- No multi-cart checkout complexity for MVP (batch via multiple listings)

## Color / IA notes from wireframes

- Blue markers ≈ sender screens; green ≈ driver screens
- Inbox yellow/green/blue highlights = initiator / direction of request
- Brand orange for primary CTAs; we keep Lonelyseat amber/leaf tokens

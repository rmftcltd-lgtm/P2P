# Lonelyseat research notes

Sources recovered after lonelyseat.co.nz went offline (Wayback + press). Used to guide this rebuild.

## Product thesis

**Lonelyseat matches people wanting to send stuff with people heading that way.**

It is an *on-the-way* peer-to-peer courier for Aotearoa New Zealand — fill spare vehicle space (the “lonely seat”) on journeys already happening, cheaper and lower-carbon than dedicated freight.

Canonical tagline from the live site (Dec 2019 archive):

> Lonelyseat matches people wanting to send stuff, with people heading that way…join now to start saving.

OG description: **A better way to deliver stuff**

Meta description: matches senders wanting cheaper/sustainable delivery with drivers wanting cash or fuel savings.

Press analogy: *like carsharing, but instead of small talk you get paid to carry their stuff.*

## Roles & primary actions

| Role | Lonelyseat term | Primary CTA |
|---|---|---|
| Sender | Sender | SEND / “I’m a sender looking for a driver to take my stuff” |
| Driver | Driver | DRIVE / “I’m a driver looking to take stuff for money” |

Nav (archived): Home · SEND · DRIVE · Help (FAQs, cancellation, T&Cs) · Contact

## Space inventory (driver capacity / sender need)

- A shoebox size space to fill
- Frontseat to fill
- Backseat to fill
- Boot to fill (Sedan)
- Boot to fill (Hatch/Wagon)
- Boot to fill (Other)
- Trailer to Fill

## Matching model

- Route / journey matching (not only “nearby now”)
- Config from archive: `DRIVE_ROUTE_RADIUS = 50` (km)
- Drivers list: vehicle, available spaces, from → to, day/time windows
- Senders list: item, space needed, pickup/dropoff, day/time windows
- Either side can initiate; accept/decline then pickup → deliver → review

## Pricing guidance (public examples)

- Aim: **≥50% cheaper** than traditional courier
- Example: desk chair **Auckland → Christchurch** traditional ~**$150**, Lonelyseat guidance ~**$70**, driver keeps ~**$60** (~14% platform take)
- Drivers & senders set value of spare space; platform recommends a guide price
- Currency: **NZD ($)**
- Payouts: “within 3 days” via Stripe (stated on How It Works)

## Trust & safety (stated product)

- Driver licence required; optional sender ID; dual-ID badge
- Drivers attest no dishonesty/theft convictions; no licence suspension in last 5 years
- Escrow until delivery complete
- Live GPS tracking + photo on drop-off
- Two-way reviews
- Optional **Lonely Cover**: $5 fee, protect stuff up to $2000

## Why join (marketing pillars)

**Senders:** save money · no packaging · leave packages where you want · flexible times · stay seated / local errands

**Drivers:** work when you want · earn within days · no uniform/fancy vehicle · explore NZ while offsetting fuel

**Sustainability:** fill empty car space · reduce dedicated freight & packaging · Trees That Count partnership / Zero Carbon framing

## Geography & ops

- Nationwide network cited: Kerikeri → Invercargill
- HQ contact on archive: 94 London St, Hamilton 3204 · support@lonelyseat.co.nz
- Waka Kotahi innovation-arm endorsement (WPBN profile)
- Founder: Riki Manarangi (Te Arawa / Ngāti Whakaue; Māori & Cook Islands)

## Archive / press sources

- Wayback homepage: `https://web.archive.org/web/20191209220454/https://lonelyseat.co.nz/`
- NZ Entrepreneur, Scoop, PR.co.nz, FutureFive, CIO, WPBN profiles (2019–)

## How this rebuild maps Lonelyseat → code

| Lonelyseat idea | Implementation in this repo |
|---|---|
| Brand & NZ positioning | Rebrand UI to Lonelyseat; NZ cities; NZD copy |
| Sender / Driver | UI labels Sender; role still `CUSTOMER`/`DRIVER` in DB |
| Space types | UI maps SMALL/MEDIUM/LARGE → shoebox / seat / boot+trailer |
| 50 km route radius | Default nearby/route match radius 50 km |
| Pricing guide | NZD fare helper calibrated toward AKL–CHC example |
| Escrow + KYC + reviews | Existing pay authorize/capture, KYC, ratings |
| On-the-way matching | Demo NZ journey places + route-oriented messaging (PostGIS path retained for scale) |

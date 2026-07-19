# Payments, email & SMS

Lonelyseat is wired for **real** card payments (Stripe), **driver payouts** (Stripe Connect Express), **email** (Mailgun), and **SMS** (Twilio). Without keys it stays in safe mock mode (logs + demo authorize/capture).

## Live demo status

Open https://lonelyseat.vercel.app/api/ops/status — shows which integrations are configured (no secrets).

## Required provider accounts

| Need | Provider | Keys |
|---|---|---|
| Card pay-in + escrow capture | [Stripe](https://dashboard.stripe.com) | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Driver payouts | Stripe Connect (enable in Dashboard → Connect) | same secret key |
| Webhooks | Stripe webhook → `https://lonelyseat.vercel.app/api/webhooks/stripe` | `STRIPE_WEBHOOK_SECRET` |
| Email | [Mailgun](https://app.mailgun.com) | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `EMAIL_FROM` |
| SMS | [Twilio](https://www.twilio.com) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| Maps + address autocomplete | [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |

Also set `NEXT_PUBLIC_APP_URL=https://lonelyseat.vercel.app` for correct email/SMS links and Connect return URLs.

## Add keys on Vercel

```bash
cd web
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add MAILGUN_API_KEY production
npx vercel env add MAILGUN_DOMAIN production
npx vercel env add EMAIL_FROM production
# Optional (EU accounts only):
# npx vercel env add MAILGUN_API_BASE production   # https://api.eu.mailgun.net
npx vercel env add TWILIO_ACCOUNT_SID production
npx vercel env add TWILIO_AUTH_TOKEN production
npx vercel env add TWILIO_FROM_NUMBER production
npx vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
npx vercel env add NEXT_PUBLIC_APP_URL production
npx vercel deploy --prod
```

Or paste them in the Vercel project → Settings → Environment Variables, then redeploy.

## Google Maps: where to copy the key

1. Open [Google Cloud Console → APIs & Services](https://console.cloud.google.com/google/maps-apis)
2. Create/select a project → enable **Maps JavaScript API** and **Places API**
3. Credentials → Create credentials → API key
4. Restrict the key (recommended):
   - Application restrictions: HTTP referrers → `https://lonelyseat.vercel.app/*` and `http://localhost:3000/*`
   - API restrictions: Maps JavaScript API + Places API
5. Paste as Vercel env `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Production + Preview), then redeploy

Without the key, address fields fall back to Nominatim search and maps use OpenStreetMap tiles.

## Mailgun: where to copy values

1. Sign in at [app.mailgun.com](https://app.mailgun.com)
2. **Domain** (`MAILGUN_DOMAIN`): Sending → Domains → copy the domain name  
   - Free/sandbox looks like `sandboxXXXXXXXX.mailgun.org`  
   - Custom looks like `mg.yourdomain.com`
3. **API key** (`MAILGUN_API_KEY`) — either:
   - Profile (top right) → **API Security** / Account Settings → **API keys** → create/copy a key, or  
   - Domain → Domain settings → **Sending API keys** → Add sending key (preferred: send-only)
4. **From address** (`EMAIL_FROM`): must use that domain, e.g.  
   `Lonelyseat <postmaster@sandboxXXXXXXXX.mailgun.org>`  
   Sandbox can only send to authorized recipients (Mailgun → Sending → Domain → Authorized Recipients).
5. **EU region only**: if your Mailgun dashboard URL is `app.eu.mailgun.com`, also set  
   `MAILGUN_API_BASE=https://api.eu.mailgun.net`  
   (US default is `https://api.mailgun.net` — leave unset if US.)

You can remove old `RESEND_API_KEY` from Vercel; it is no longer used.

## Stripe webhook events to enable

- `payment_intent.amount_capturable_updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`

Endpoint: `POST /api/webhooks/stripe`

## Money flow

1. Sender authorizes card (manual capture) via Stripe Payment Element  
2. Funds held until status → `DELIVERED`  
3. Platform captures PaymentIntent  
4. Platform transfers driver share to their Connect account (`offer − fee − cover − donations`)  
5. Mutual cancel → PaymentIntent cancel/refund; forced cancel → no refund  

## Notification triggers

Branded HTML emails (Mailgun) + optional SMS (Twilio). Copy follows Lonelyseat email templates (grammar polished). Without keys, messages are mock-logged.

| Event | Who gets email |
|---|---|
| Register | Welcome (sender or driver variant) |
| Incomplete registration (~2d / ~10d) | Reminder via `GET /api/cron/registration-reminders` |
| Offer / seat request created | Recipient (+ booking details) |
| Offer accepted | Both parties (“confirmed” / “accepted”) |
| Offer rejected or sibling not chosen | Unsuccessful party |
| Payment authorised | Sender (+ driver if assigned) |
| Status → Picked up | Sender |
| Status → In transit | Sender (“driver on their way”) |
| Status → Delivered | Sender (arrived + invoice + review CTA), driver (completed + payout + invoice) |
| Mutual cancel requested | Other party |
| Mutual cancel accepted / rejected | Relevant parties |
| Forced cancel | Other party |

Admin ops alerts (damage / refused pick-up) use `notifyAdminAlert` when `ADMIN_NOTIFY_EMAIL` is set.

Phones should be NZ-friendly (`+64…` or `021…`); they are normalized to E.164 for Twilio.

## Driver setup in the app

Driver dashboard → **Set up payouts** → Stripe Connect Express onboarding (or mock Connect when Stripe keys are absent).

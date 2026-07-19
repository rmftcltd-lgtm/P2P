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
| Email (preferred) | [Resend](https://resend.com) or [SendGrid](https://sendgrid.com) | `RESEND_API_KEY` **or** `SENDGRID_API_KEY`, plus `EMAIL_FROM` |
| Email (alt) | [Mailgun](https://app.mailgun.com) **verified custom domain only** | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `EMAIL_FROM` |
| SMS | [Twilio](https://www.twilio.com) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| Maps + address autocomplete | [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |

Also set `NEXT_PUBLIC_APP_URL=https://lonelyseat.vercel.app` for correct email/SMS links and Connect return URLs.

## Add keys on Vercel

```bash
cd web
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
# Email — pick one unrestricted provider (not Mailgun sandbox):
npx vercel env add RESEND_API_KEY production
# npx vercel env add SENDGRID_API_KEY production
# npx vercel env add MAILGUN_API_KEY production   # custom domain only
# npx vercel env add MAILGUN_DOMAIN production
npx vercel env add EMAIL_FROM production
# Optional (EU Mailgun only):
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

## Email: remove sandbox / recipient opt-in

Lonelyseat **does not** use Mailgun sandbox authorized-recipients. Users must never have to confirm they are happy to receive mail.

Configure **one** of these (first match wins):

### Option A — Resend (recommended)

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your domain (DNS records Resend shows you)
3. Create an API key → Vercel env `RESEND_API_KEY`
4. Set `EMAIL_FROM` to an address on that domain, e.g. `Lonelyseat <hello@mg.yourdomain.com>`
5. Redeploy

### Option B — SendGrid

1. [SendGrid](https://sendgrid.com) → create API key → `SENDGRID_API_KEY`
2. Complete **Domain Authentication** (or Single Sender Verification for tests only)
3. Set `EMAIL_FROM` to the verified sender
4. Redeploy

### Option C — Mailgun with a **verified custom domain** (not sandbox)

1. Sign in at [app.mailgun.com](https://app.mailgun.com)
2. Sending → Domains → **Add new domain** (e.g. `mg.yourdomain.com`) — do **not** use `sandbox….mailgun.org`
3. Add the DNS records Mailgun shows (SPF/DKIM/MX as required) and wait until the domain is **Verified**
4. Set Vercel envs:
   - `MAILGUN_API_KEY` — account or domain sending key
   - `MAILGUN_DOMAIN` — your custom domain (e.g. `mg.yourdomain.com`)
   - `EMAIL_FROM` — `Lonelyseat <postmaster@mg.yourdomain.com>`
   - Optional EU: `MAILGUN_API_BASE=https://api.eu.mailgun.net`
5. Redeploy

Sandbox domains are ignored by the app (unless you explicitly set `MAILGUN_ALLOW_SANDBOX=true` for local debugging). Check https://lonelyseat.vercel.app/api/ops/status — `emailUnrestricted` should be `true` and `mailgunSandbox` should be `false` (or provider `resend` / `sendgrid`).

```bash
cd web
npx vercel env add RESEND_API_KEY production
# or:
# npx vercel env add SENDGRID_API_KEY production
# or update MAILGUN_DOMAIN away from sandbox…
npx vercel env add EMAIL_FROM production
npx vercel deploy --prod
```


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

Branded HTML emails (Resend / SendGrid / Mailgun custom domain) + optional SMS (Twilio). Copy follows Lonelyseat email templates (grammar polished). Without an unrestricted provider, messages are mock-logged (Mailgun sandbox is not used).


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

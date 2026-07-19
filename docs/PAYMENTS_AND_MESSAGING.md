# Payments, email & SMS

Lonelyseat is wired for **real** card payments (Stripe), **driver payouts** (Stripe Connect Express), **email** (Resend), and **SMS** (Twilio). Without keys it stays in safe mock mode (logs + demo authorize/capture).

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
npx vercel env add NEXT_PUBLIC_APP_URL production
npx vercel deploy --prod
```

Or paste them in the Vercel project → Settings → Environment Variables, then redeploy.

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

| Event | Email / SMS |
|---|---|
| Register | Welcome |
| Offer created | Recipient |
| Offer accepted | Both parties |
| Payment authorized | Sender (+ driver if assigned) |
| Status changes | Both parties |
| Cancellation | Other party / both |
| Payout sent | Driver |

Phones should be NZ-friendly (`+64…` or `021…`); they are normalized to E.164 for Twilio.

## Driver setup in the app

Driver dashboard → **Set up payouts** → Stripe Connect Express onboarding (or mock Connect when Stripe keys are absent).

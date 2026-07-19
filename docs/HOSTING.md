# Permanent hosting for testing

## Live demo (Vercel)

**https://lonelyseat.vercel.app**

Demo logins:
- Sender: `sender@lonelyseat.test` / `password123`
- Driver: `driver@lonelyseat.test` / `password123`

Note: production uses ephemeral SQLite under `/tmp` (re-seeded from a build-time DB copy). Fine for testing; use Postgres/Turso for durable production data.

## Option A — Render (Docker / long-running Node)

One-click deploy (free web service; cold-starts after idle):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/rmftcltd-lgtm/P2P)

Or: Render Dashboard → New → Blueprint → select `rmftcltd-lgtm/P2P` → use `render.yaml`.

## Option B — Vercel (already deployed)

Project: `lonelyseat` under the connected GitHub account. Redeploy:

```bash
cd web && npx vercel deploy --prod
```

Connect the Git repo in the Vercel dashboard for automatic deploys on push.

## Local / agent tunnel (temporary)

```bash
cd web && npm run dev
npx cloudflared tunnel --url http://localhost:3000
```

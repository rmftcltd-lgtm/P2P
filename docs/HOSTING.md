# Permanent hosting for testing

This app needs a **hosting account** for a stable public URL (Cloudflare quick tunnels expire when the agent stops).

## Option A — Render (recommended for this SQLite stack)

One-click deploy (free web service; cold-starts after idle):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/rmftcltd-lgtm/P2P)

Or: Render Dashboard → New → Blueprint → select `rmftcltd-lgtm/P2P` → use `render.yaml`.

After deploy you get a permanent URL like:

`https://lonelyseat.onrender.com`

Demo logins stay the same (`sender@lonelyseat.test` / `driver@lonelyseat.test` · `password123`).

Notes:
- Free tier sleeps after ~15 minutes idle (first request can take ~30–60s).
- SQLite is ephemeral on free (re-seeds on fresh instance). Fine for testing.

## Option B — Vercel

Vercel works best with Postgres (Neon). This repo’s default SQLite + `better-sqlite3` is aimed at a long-running Node host (Render/Docker), not serverless.

If you prefer Vercel: add a Neon `DATABASE_URL`, switch Prisma provider to `postgresql`, then deploy the `web/` directory.

## Local / agent tunnel (temporary)

```bash
cd web && npm run dev
npx cloudflared tunnel --url http://localhost:3000
```

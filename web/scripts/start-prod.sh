#!/bin/sh
set -eu

DB_PATH="${DATABASE_URL#file:}"
mkdir -p "$(dirname "$DB_PATH")"

echo "Applying migrations…"
npx prisma migrate deploy

NEED_SEED=1
if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ]; then
  if node <<'NODE'
const { PrismaClient } = require("./src/generated/prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");
const url = process.env.DATABASE_URL || "file:./prod.db";
const resolved =
  url.startsWith("file:") && !url.startsWith("file:/")
    ? "file:" + path.resolve(process.cwd(), url.replace(/^file:/, ""))
    : url;
const adapter = new PrismaBetterSqlite3({ url: resolved });
const prisma = new PrismaClient({ adapter });
prisma.user
  .count()
  .then((n) => {
    return prisma.$disconnect().then(() => process.exit(n > 0 ? 0 : 2));
  })
  .catch(() => process.exit(2));
NODE
  then
    NEED_SEED=0
  fi
fi

if [ "$NEED_SEED" = "1" ]; then
  echo "Seeding demo data…"
  npx prisma db seed || true
fi

echo "Starting Lonelyseat on :${PORT:-3000}"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"

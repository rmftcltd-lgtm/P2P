import path from "node:path";
import fs from "node:fs";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  lonelyseatDbReady?: boolean;
};

/** On Vercel, SQLite must live under /tmp (writable, ephemeral — fine for demos). */
export function resolveDatabaseUrl(url = process.env.DATABASE_URL ?? "file:./dev.db") {
  if (process.env.VERCEL) {
    return "file:/tmp/lonelyseat.db";
  }
  if (url.startsWith("file:") && !url.startsWith("file:/")) {
    return `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), url.replace(/^file:/, ""))}`;
  }
  return url;
}

function ensureVercelSqliteFile() {
  if (!process.env.VERCEL || globalForPrisma.lonelyseatDbReady) return;
  const target = "/tmp/lonelyseat.db";
  const bundled = path.join(process.cwd(), "prisma", "vercel-seed.db");
  if (!fs.existsSync(target) || fs.statSync(target).size === 0) {
    if (fs.existsSync(bundled)) {
      fs.copyFileSync(bundled, target);
    }
  }
  globalForPrisma.lonelyseatDbReady = true;
}

function createPrismaClient() {
  ensureVercelSqliteFile();
  const url = resolveDatabaseUrl();

  if (url.startsWith("postgres")) {
    throw new Error(
      "Postgres URL detected. Use docker compose up -d, switch prisma provider to postgresql, install @prisma/adapter-pg, then migrate. See docs/ARCHITECTURE.md § Database.",
    );
  }

  // Lazy require keeps Next from bundling native sqlite into edge wrongly.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" || process.env.VERCEL) {
  globalForPrisma.prisma = prisma;
}

export function isPostgresUrl(url = process.env.DATABASE_URL) {
  return Boolean(url?.startsWith("postgres"));
}

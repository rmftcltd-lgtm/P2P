import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveSqliteUrl(url: string) {
  if (url.startsWith("file:") && !url.startsWith("file:/")) {
    return `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), url.replace(/^file:/, ""))}`;
  }
  return url;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  // Postgres: set DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
  // and DATABASE_PROVIDER=postgresql — requires @prisma/adapter-pg + schema provider switch.
  // SQLite remains the default zero-ops path for local MVP.
  if (url.startsWith("postgres")) {
    throw new Error(
      "Postgres URL detected. Use docker compose up -d, switch prisma provider to postgresql, install @prisma/adapter-pg, then migrate. See docs/ARCHITECTURE.md § Database.",
    );
  }

  // Lazy require keeps Next from bundling native sqlite into edge wrongly.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl(url) });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isPostgresUrl(url = process.env.DATABASE_URL) {
  return Boolean(url?.startsWith("postgres"));
}

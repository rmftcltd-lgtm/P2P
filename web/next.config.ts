import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],
  // Allow Cloudflare tunnel / preview hosts during local demos
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;

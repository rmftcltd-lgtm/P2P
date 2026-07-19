import { requireSession } from "@/lib/auth";

export async function requireAdmin() {
  return requireSession(["ADMIN"]);
}

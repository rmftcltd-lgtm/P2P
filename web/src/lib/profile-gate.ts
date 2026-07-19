import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonError } from "@/lib/api";

/**
 * Wireframe: until profile is complete, block booking actions
 * (list / offer / accept). Browse and estimate stay open.
 */
export async function requireCompleteRegistration() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      registrationComplete: true,
      physicalAddress: true,
    },
  });
  if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  if (!user.registrationComplete) {
    return {
      session: user,
      incomplete: true as const,
      response: jsonError(
        "Please complete your profile before booking or listing",
        403,
        { code: "PROFILE_INCOMPLETE", next: "/account" },
      ),
    };
  }
  return { session: user, incomplete: false as const, response: null };
}

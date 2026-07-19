import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const users = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
        ...(q
          ? {
              OR: [
                { email: { contains: q } },
                { name: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      include: { driver: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return jsonOk({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        registrationComplete: u.registrationComplete,
        idVerified: u.idVerified,
        licenceVerified: u.licenceVerified,
        kycStatus: u.driver?.kycStatus ?? null,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

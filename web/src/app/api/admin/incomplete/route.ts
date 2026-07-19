import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const users = await prisma.user.findMany({
      where: {
        registrationComplete: false,
        role: { not: "ADMIN" },
        ...(q ? { email: { contains: q } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, email: true, name: true, createdAt: true, role: true },
    });
    return jsonOk({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("Missing id", 400);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.registrationComplete) return jsonError("Not found", 404);
    await prisma.user.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

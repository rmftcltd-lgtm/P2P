import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
    const feedback = await prisma.userFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return jsonOk({ feedback });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["NEW", "READ", "ARCHIVED"]),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const row = await prisma.userFeedback.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    return jsonOk({ feedback: row });
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
    await prisma.userFeedback.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

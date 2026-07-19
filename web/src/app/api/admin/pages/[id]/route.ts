import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  content: z.string().max(20000).optional(),
  position: z.enum(["HEADER", "FOOTER", "BOTH"]).optional(),
  metaDescription: z.string().max(300).nullable().optional(),
  published: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const page = await prisma.contentPage.findUnique({ where: { id } });
    if (!page) return jsonError("Not found", 404);
    return jsonOk({ page });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const page = await prisma.contentPage.update({ where: { id }, data: body });
    return jsonOk({ page });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.contentPage.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

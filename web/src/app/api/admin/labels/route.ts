import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  category: z.enum(["TIME", "SPACE", "RIDE"]),
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as "TIME" | "SPACE" | "RIDE" | null;
    const labels = await prisma.labelOption.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    return jsonOk({ labels });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await req.json());
    const count = await prisma.labelOption.count({ where: { category: body.category } });
    const label = await prisma.labelOption.create({
      data: {
        category: body.category,
        key: body.key,
        label: body.label,
        sortOrder: body.sortOrder ?? count,
      },
    });
    return jsonOk({ label }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

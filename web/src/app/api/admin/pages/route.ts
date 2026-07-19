import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { handleApiError, jsonOk } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(2).max(120),
  slug: z.string().min(1).max(80).optional(),
  content: z.string().max(20000).default(""),
  position: z.enum(["HEADER", "FOOTER", "BOTH"]).default("FOOTER"),
  metaDescription: z.string().max(300).optional(),
  published: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const pages = await prisma.contentPage.findMany({ orderBy: { updatedAt: "desc" } });
    return jsonOk({ pages });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await req.json());
    const page = await prisma.contentPage.create({
      data: {
        title: body.title,
        slug: body.slug || slugify(body.title),
        content: body.content,
        position: body.position,
        metaDescription: body.metaDescription,
        published: body.published ?? true,
      },
    });
    return jsonOk({ page }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

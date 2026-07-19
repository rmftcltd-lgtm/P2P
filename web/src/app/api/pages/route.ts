import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

/** Public published CMS pages for header/footer. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get("position");
    const pages = await prisma.contentPage.findMany({
      where: {
        published: true,
        ...(position === "HEADER"
          ? { OR: [{ position: "HEADER" }, { position: "BOTH" }] }
          : position === "FOOTER"
            ? { OR: [{ position: "FOOTER" }, { position: "BOTH" }] }
            : {}),
      },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        position: true,
        metaDescription: true,
      },
    });
    return jsonOk({ pages });
  } catch (err) {
    return handleApiError(err);
  }
}

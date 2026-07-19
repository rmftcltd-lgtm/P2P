import { getActiveLabels } from "@/lib/labels";
import { handleApiError, jsonOk } from "@/lib/api";
import type { LabelCategory } from "@/generated/prisma/client";

/** Public labels for forms (space / ride / time). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") ?? "SPACE").toUpperCase() as LabelCategory;
    const labels = await getActiveLabels(category);
    return jsonOk({
      labels: labels.map((l) => ({ key: l.key, label: l.label })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

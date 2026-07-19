import { prisma } from "@/lib/prisma";
import type { LabelCategory } from "@/generated/prisma/client";
import { SPACE_OPTIONS } from "@/lib/spaces";
import { slugify } from "@/lib/slugify";

export { slugify };

export async function getActiveLabels(category: LabelCategory) {
  const rows = await prisma.labelOption.findMany({
    where: { category, active: true },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length > 0) return rows;
  // Fallback defaults if DB empty
  if (category === "SPACE") {
    return SPACE_OPTIONS.map((s, i) => ({
      id: s.key,
      category: "SPACE" as const,
      key: s.key,
      label: s.label,
      sortOrder: i,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
  if (category === "TIME") {
    return [
      { key: "flexible", label: "Flexible" },
      { key: "morning", label: "Morning only (7am–midday)" },
      { key: "afternoon", label: "Afternoon only (midday–6pm)" },
      { key: "evening", label: "Evening only (after 6pm)" },
    ].map((s, i) => ({
      id: s.key,
      category: "TIME" as const,
      key: s.key,
      label: s.label,
      sortOrder: i,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
  if (category === "RIDE") {
    return [
      { key: "pd", label: "Motorised PD (e.g. scooter / bike)" },
      { key: "hatch", label: "Hatchback" },
      { key: "sedan_small", label: "Small sedan" },
      { key: "ute", label: "Ute" },
      { key: "van_small", label: "Small van" },
      { key: "suv", label: "SUV" },
    ].map((s, i) => ({
      id: s.key,
      category: "RIDE" as const,
      key: s.key,
      label: s.label,
      sortOrder: i,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
  return [];
}

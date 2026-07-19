/** Lonelyseat space inventory from archive + tutorials */
export const SPACE_OPTIONS = [
  {
    key: "shoebox",
    label: "Shoebox / parcel",
    mapsTo: "SMALL" as const,
    hint: "Small boxed parcel — glovebox or footwell size",
    image: "/spaces/shoebox.webp",
  },
  {
    key: "frontseat",
    label: "Front seat",
    mapsTo: "MEDIUM" as const,
    hint: "Fits on the front passenger seat",
    image: "/spaces/frontseat.webp",
  },
  {
    key: "backseat",
    label: "Back seat",
    mapsTo: "MEDIUM" as const,
    hint: "Fits across the rear seat bench",
    image: "/spaces/backseat.webp",
  },
  {
    key: "boot_sedan",
    label: "Boot (sedan)",
    mapsTo: "LARGE" as const,
    hint: "Sedan boot / trunk space",
    image: "/spaces/boot_sedan.webp",
  },
  {
    key: "boot_hatch",
    label: "Boot (hatch/wagon)",
    mapsTo: "LARGE" as const,
    hint: "Hatchback or wagon cargo bay",
    image: "/spaces/boot_hatch.webp",
  },
  {
    key: "boot_other",
    label: "Boot (other)",
    mapsTo: "LARGE" as const,
    hint: "SUV, ute tray cover, or larger boot",
    image: "/spaces/boot_other.webp",
  },
  {
    key: "trailer",
    label: "Trailer",
    mapsTo: "LARGE" as const,
    hint: "Box trailer for bulky gear",
    image: "/spaces/trailer.webp",
  },
] as const;

export type SpaceKey = (typeof SPACE_OPTIONS)[number]["key"];

export const SPACE_LABELS = {
  SMALL: "Shoebox / parcel",
  MEDIUM: "Front or back seat",
  LARGE: "Boot or trailer",
} as const;

export function spaceToPackageSize(space: string): "SMALL" | "MEDIUM" | "LARGE" {
  const hit = SPACE_OPTIONS.find((s) => s.key === space);
  return hit?.mapsTo ?? "SMALL";
}

export function spaceImage(space: string): string | null {
  return SPACE_OPTIONS.find((s) => s.key === space)?.image ?? null;
}

export function spaceMeta(space: string) {
  return SPACE_OPTIONS.find((s) => s.key === space) ?? null;
}

export const TRIP_TYPE_LABELS = {
  ONE_WAY: "One-way",
  DAY_TRIP: "Day trip",
  MULTI: "Multiple listings",
} as const;

export const LONELY_COVER_FEE = 5;
export const LONELY_COVER_LIMIT = 2000;

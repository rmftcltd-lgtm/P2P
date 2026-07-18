/** Lonelyseat space inventory from archive + tutorials */
export const SPACE_OPTIONS = [
  { key: "shoebox", label: "Shoebox / parcel", mapsTo: "SMALL" as const },
  { key: "frontseat", label: "Front seat", mapsTo: "MEDIUM" as const },
  { key: "backseat", label: "Back seat", mapsTo: "MEDIUM" as const },
  { key: "boot_sedan", label: "Boot (sedan)", mapsTo: "LARGE" as const },
  { key: "boot_hatch", label: "Boot (hatch/wagon)", mapsTo: "LARGE" as const },
  { key: "boot_other", label: "Boot (other)", mapsTo: "LARGE" as const },
  { key: "trailer", label: "Trailer", mapsTo: "LARGE" as const },
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

export const TRIP_TYPE_LABELS = {
  ONE_WAY: "One-way",
  DAY_TRIP: "Day trip",
  MULTI: "Multiple listings",
} as const;

export const LONELY_COVER_FEE = 5;
export const LONELY_COVER_LIMIT = 2000;

/** Lonelyseat space / ride capacity options (with photos). */
export const SPACE_OPTIONS = [
  {
    key: "on_foot",
    label: "On foot",
    mapsTo: "SMALL" as const,
    hint: "Walking courier — envelope or small hand-carry",
    image: "/spaces/on_foot.webp",
  },
  {
    key: "bicycle",
    label: "Bicycle",
    mapsTo: "SMALL" as const,
    hint: "Bike basket, panniers, or small rack bag",
    image: "/spaces/bicycle.webp",
  },
  {
    key: "scooter",
    label: "Scooter",
    mapsTo: "SMALL" as const,
    hint: "E-scooter or motor scooter under-seat / top box",
    image: "/spaces/scooter.webp",
  },
  {
    key: "motorcycle",
    label: "Motorcycle",
    mapsTo: "MEDIUM" as const,
    hint: "Motorbike top box or side panniers",
    image: "/spaces/motorcycle.webp",
  },
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
    key: "roof_rack",
    label: "Roof rack",
    mapsTo: "LARGE" as const,
    hint: "Roof bars or roof box for long / awkward items",
    image: "/spaces/roof_rack.webp",
  },
  {
    key: "ute",
    label: "Ute tray",
    mapsTo: "LARGE" as const,
    hint: "Open ute tray — good for bulky or dirty loads",
    image: "/spaces/ute.webp",
  },
  {
    key: "van_small",
    label: "Small van",
    mapsTo: "LARGE" as const,
    hint: "City van / compact cargo (e.g. Kangoo, Caddy)",
    image: "/spaces/van_small.webp",
  },
  {
    key: "van_medium",
    label: "Medium van",
    mapsTo: "LARGE" as const,
    hint: "Mid cargo van (e.g. Transit Custom, HiAce)",
    image: "/spaces/van_medium.webp",
  },
  {
    key: "van_large",
    label: "Large van",
    mapsTo: "LARGE" as const,
    hint: "Full-size cargo van (e.g. Transit, Sprinter)",
    image: "/spaces/van_large.webp",
  },
  {
    key: "truck_small",
    label: "Small truck",
    mapsTo: "LARGE" as const,
    hint: "Light truck / tipper under ~3.5 t",
    image: "/spaces/truck_small.webp",
  },
  {
    key: "truck_medium",
    label: "Medium truck",
    mapsTo: "LARGE" as const,
    hint: "Medium rigid truck for pallet-scale loads",
    image: "/spaces/truck_medium.webp",
  },
  {
    key: "truck_large",
    label: "Large truck",
    mapsTo: "LARGE" as const,
    hint: "Heavy rigid truck for big freight",
    image: "/spaces/truck_large.webp",
  },
  {
    key: "truck_trailer",
    label: "Truck & trailer",
    mapsTo: "LARGE" as const,
    hint: "Truck with trailer — max capacity runs",
    image: "/spaces/truck_trailer.webp",
  },
  {
    key: "trailer",
    label: "Trailer",
    mapsTo: "LARGE" as const,
    hint: "Box or flat trailer for bulky gear",
    image: "/spaces/trailer.webp",
  },
] as const;

export type SpaceKey = (typeof SPACE_OPTIONS)[number]["key"];

export const SPACE_KEYS = SPACE_OPTIONS.map((s) => s.key) as [
  SpaceKey,
  ...SpaceKey[],
];

export const SPACE_LABELS = {
  SMALL: "Small parcel / bike / scooter",
  MEDIUM: "Seat or motorcycle",
  LARGE: "Boot, van, truck, or trailer",
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

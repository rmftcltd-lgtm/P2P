/** Lonelyseat space / ride capacity options (with photos). */
export const SPACE_OPTIONS = [
  {
    key: "on_foot",
    label: "On foot",
    mapsTo: "SMALL" as const,
    hint: "Walking courier — envelope or small hand-carry",
    image: "/spaces/on_foot.webp",
    /** Typical cargo volume (m³) for freight comparison. */
    freightVolumeM3: 0.02,
    /** Door-to-door freight handling / pickup-delivery base (NZD). */
    freightHandling: 28,
    /** NZ freight linehaul-style rate per km for this capacity (NZD). */
    freightPerKm: 0.09,
  },
  {
    key: "bicycle",
    label: "Bicycle",
    mapsTo: "SMALL" as const,
    hint: "Bike basket, panniers, or small rack bag",
    image: "/spaces/bicycle.webp",
    freightVolumeM3: 0.04,
    freightHandling: 30,
    freightPerKm: 0.1,
  },
  {
    key: "scooter",
    label: "Scooter",
    mapsTo: "SMALL" as const,
    hint: "E-scooter or motor scooter under-seat / top box",
    image: "/spaces/scooter.webp",
    freightVolumeM3: 0.05,
    freightHandling: 32,
    freightPerKm: 0.11,
  },
  {
    key: "motorcycle",
    label: "Motorcycle",
    mapsTo: "MEDIUM" as const,
    hint: "Motorbike top box or side panniers",
    image: "/spaces/motorcycle.webp",
    freightVolumeM3: 0.12,
    freightHandling: 36,
    freightPerKm: 0.14,
  },
  {
    key: "shoebox",
    label: "Shoebox / parcel",
    mapsTo: "SMALL" as const,
    hint: "Small boxed parcel — glovebox or footwell size",
    image: "/spaces/shoebox.webp",
    freightVolumeM3: 0.05,
    freightHandling: 34,
    freightPerKm: 0.12,
  },
  {
    key: "frontseat",
    label: "Front seat",
    mapsTo: "MEDIUM" as const,
    hint: "Fits on the front passenger seat",
    image: "/spaces/frontseat.webp",
    freightVolumeM3: 0.2,
    freightHandling: 40,
    freightPerKm: 0.16,
  },
  {
    key: "backseat",
    label: "Back seat",
    mapsTo: "MEDIUM" as const,
    hint: "Fits across the rear seat bench",
    image: "/spaces/backseat.webp",
    freightVolumeM3: 0.4,
    freightHandling: 45,
    freightPerKm: 0.19,
  },
  {
    key: "boot_sedan",
    label: "Boot (sedan)",
    mapsTo: "LARGE" as const,
    hint: "Sedan boot / trunk space",
    image: "/spaces/boot_sedan.webp",
    freightVolumeM3: 0.5,
    freightHandling: 55,
    freightPerKm: 0.24,
  },
  {
    key: "boot_hatch",
    label: "Boot (hatch/wagon)",
    mapsTo: "LARGE" as const,
    hint: "Hatchback or wagon cargo bay",
    image: "/spaces/boot_hatch.webp",
    freightVolumeM3: 0.75,
    freightHandling: 60,
    freightPerKm: 0.27,
  },
  {
    key: "boot_other",
    label: "Boot (other)",
    mapsTo: "LARGE" as const,
    hint: "SUV, ute tray cover, or larger boot",
    image: "/spaces/boot_other.webp",
    freightVolumeM3: 1,
    freightHandling: 65,
    freightPerKm: 0.3,
  },
  {
    key: "roof_rack",
    label: "Roof rack",
    mapsTo: "LARGE" as const,
    hint: "Roof bars or roof box for long / awkward items",
    image: "/spaces/roof_rack.webp",
    freightVolumeM3: 0.8,
    freightHandling: 70,
    freightPerKm: 0.28,
  },
  {
    key: "ute",
    label: "Ute tray",
    mapsTo: "LARGE" as const,
    hint: "Open ute tray — good for bulky or dirty loads",
    image: "/spaces/ute.webp",
    freightVolumeM3: 2,
    freightHandling: 95,
    freightPerKm: 0.45,
  },
  {
    key: "van_small",
    label: "Small van",
    mapsTo: "LARGE" as const,
    hint: "City van / compact cargo (e.g. Kangoo, Caddy)",
    image: "/spaces/van_small.webp",
    freightVolumeM3: 4,
    freightHandling: 130,
    freightPerKm: 0.7,
  },
  {
    key: "van_medium",
    label: "Medium van",
    mapsTo: "LARGE" as const,
    hint: "Mid cargo van (e.g. Transit Custom, HiAce)",
    image: "/spaces/van_medium.webp",
    freightVolumeM3: 8,
    freightHandling: 175,
    freightPerKm: 0.95,
  },
  {
    key: "van_large",
    label: "Large van",
    mapsTo: "LARGE" as const,
    hint: "Full-size cargo van (e.g. Transit, Sprinter)",
    image: "/spaces/van_large.webp",
    freightVolumeM3: 12,
    freightHandling: 220,
    freightPerKm: 1.2,
  },
  {
    key: "truck_small",
    label: "Small truck",
    mapsTo: "LARGE" as const,
    hint: "Light truck / tipper under ~3.5 t",
    image: "/spaces/truck_small.webp",
    freightVolumeM3: 15,
    freightHandling: 260,
    freightPerKm: 1.45,
  },
  {
    key: "truck_medium",
    label: "Medium truck",
    mapsTo: "LARGE" as const,
    hint: "Medium rigid truck for pallet-scale loads",
    image: "/spaces/truck_medium.webp",
    freightVolumeM3: 25,
    freightHandling: 320,
    freightPerKm: 1.9,
  },
  {
    key: "truck_large",
    label: "Large truck",
    mapsTo: "LARGE" as const,
    hint: "Heavy rigid truck for big freight",
    image: "/spaces/truck_large.webp",
    freightVolumeM3: 40,
    freightHandling: 400,
    freightPerKm: 2.45,
  },
  {
    key: "truck_trailer",
    label: "Truck & trailer",
    mapsTo: "LARGE" as const,
    hint: "Truck with trailer — max capacity runs",
    image: "/spaces/truck_trailer.webp",
    freightVolumeM3: 65,
    freightHandling: 520,
    freightPerKm: 3.1,
  },
  {
    key: "trailer",
    label: "Trailer",
    mapsTo: "LARGE" as const,
    hint: "Box or flat trailer for bulky gear",
    image: "/spaces/trailer.webp",
    freightVolumeM3: 3,
    freightHandling: 110,
    freightPerKm: 0.55,
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

/** Fallback freight params when only SMALL/MEDIUM/LARGE is known. */
export const PACKAGE_SIZE_FREIGHT = {
  SMALL: { freightVolumeM3: 0.05, freightHandling: 34, freightPerKm: 0.12 },
  MEDIUM: { freightVolumeM3: 0.3, freightHandling: 42, freightPerKm: 0.17 },
  LARGE: { freightVolumeM3: 0.5, freightHandling: 55, freightPerKm: 0.24 },
} as const;

export const TRIP_TYPE_LABELS = {
  ONE_WAY: "One-way",
  DAY_TRIP: "Day trip",
  MULTI: "Multiple listings",
} as const;

export const LONELY_COVER_FEE = 5;
export const LONELY_COVER_LIMIT = 2000;

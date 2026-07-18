const EARTH_RADIUS_KM = 6371;

/** Lonelyseat archive default: DRIVE_ROUTE_RADIUS = 50 */
export const ROUTE_RADIUS_KM = 50;

/** Haversine distance in kilometers between two WGS84 points. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Lonelyseat-style NZD pricing guidance.
 * Calibrated so Auckland→Christchurch (~762 km) LARGE ≈ $70 (press example),
 * vs traditional ~$150 — about half price, ~14% platform fee elsewhere.
 */
export function estimateFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE",
): number {
  const sizeMultiplier = { SMALL: 0.72, MEDIUM: 1, LARGE: 1.35 }[packageSize];
  const fare = (8 + distance * 0.055) * sizeMultiplier;
  return Math.round(Math.max(12, fare) * 100) / 100;
}

/** Traditional courier comparison (~2× Lonelyseat guide). */
export function traditionalCompareFare(lonelyseatFare: number) {
  return Math.round(lonelyseatFare * 2.1 * 100) / 100;
}

export const SPACE_LABELS = {
  SMALL: "Shoebox / parcel",
  MEDIUM: "Front or back seat",
  LARGE: "Boot or trailer",
} as const;

export type DemoPlace = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

/** NZ demo pins for on-the-way corridor matching (Lonelyseat geography). */
export const DEMO_PLACES: DemoPlace[] = [
  {
    label: "Auckland CBD",
    address: "Queen St, Auckland CBD, Auckland",
    lat: -36.8485,
    lng: 174.7633,
  },
  {
    label: "Hamilton",
    address: "Victoria St, Hamilton Central, Hamilton",
    lat: -37.787,
    lng: 175.2793,
  },
  {
    label: "Tauranga",
    address: "The Strand, Tauranga",
    lat: -37.6878,
    lng: 176.1651,
  },
  {
    label: "Taupō",
    address: "Tongariro St, Taupō",
    lat: -38.6857,
    lng: 176.0702,
  },
  {
    label: "Wellington",
    address: "Lambton Quay, Wellington",
    lat: -41.2865,
    lng: 174.7762,
  },
  {
    label: "Christchurch",
    address: "Cathedral Square, Christchurch",
    lat: -43.5321,
    lng: 172.6362,
  },
  {
    label: "Nelson",
    address: "Trafalgar St, Nelson",
    lat: -41.2706,
    lng: 173.284,
  },
  {
    label: "Dunedin",
    address: "The Octagon, Dunedin",
    lat: -45.8788,
    lng: 170.5028,
  },
];

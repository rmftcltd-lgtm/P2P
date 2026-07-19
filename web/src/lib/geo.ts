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
 * Comparable NZ courier / light-freight guide (NZD incl. GST band).
 *
 * Anchored to public NZ Post large-parcel overnight ranges (up to ~$198 for
 * heavier 25 kg jobs), Courier Economy (~$25–$125), and intercity quotes for
 * boot-sized items such as Auckland→Christchurch (~762 km) around **$150–$160**.
 */
export function estimateTraditionalCourierFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE",
): number {
  const sizeMultiplier = { SMALL: 0.55, MEDIUM: 0.78, LARGE: 1 }[packageSize];
  const fare = (22 + distance * 0.17) * sizeMultiplier;
  return Math.round(Math.max(18, fare) * 100) / 100;
}

/**
 * Lonelyseat guidance ≈ **one third** of a comparable NZ courier quote.
 * Example: Auckland→Christchurch LARGE ≈ $50 vs ~$150 courier.
 */
export function estimateFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE",
): number {
  const traditional = estimateTraditionalCourierFare(distance, packageSize);
  return Math.round(Math.max(8, traditional / 3) * 100) / 100;
}

/** Courier comparison from a Lonelyseat fare (≈ 3×). */
export function traditionalCompareFare(lonelyseatFare: number) {
  return Math.round(lonelyseatFare * 3 * 100) / 100;
}

export type DemoPlace = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

/** NZ demo pins for on-the-way journey matching (Lonelyseat geography). */
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

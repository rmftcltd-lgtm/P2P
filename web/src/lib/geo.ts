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
 * Comparable NZ courier **and freight** guide (NZD).
 *
 * Anchored above parcel-only tickets toward domestic LCL / light-freight style
 * quotes (e.g. Mainfreight door-to-door bands for boot-sized or awkward items),
 * where Auckland→Christchurch (~765 km) commonly lands around **~$200** once
 * pick-up, linehaul, and residential delivery are in. Parcel couriers alone are
 * often cheaper for tiny boxes; Lonelyseat mainly competes when stuff needs a
 * seat, boot, or trailer.
 */
export function estimateCourierFreightFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE",
): number {
  const sizeMultiplier = { SMALL: 0.58, MEDIUM: 0.8, LARGE: 1 }[packageSize];
  // ~$200 AKL→CHC LARGE guide; scales with distance + handling base.
  const fare = (38 + distance * 0.21) * sizeMultiplier;
  return Math.round(Math.max(28, fare) * 100) / 100;
}

/** @deprecated Prefer estimateCourierFreightFare */
export function estimateTraditionalCourierFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE",
) {
  return estimateCourierFreightFare(distance, packageSize);
}

/**
 * Lonelyseat guidance relative to the courier/freight guide above.
 * (Internally ~½ of that guide — not marketed as a fixed ratio in UI copy.)
 */
export function estimateFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE",
): number {
  const guide = estimateCourierFreightFare(distance, packageSize);
  return Math.round(Math.max(10, guide / 2) * 100) / 100;
}

/** Approximate driver take after the standard platform share (~14%). */
export function estimateDriverTake(lonelyseatFare: number) {
  const fee = Math.round(lonelyseatFare * 0.14 * 100) / 100;
  return Math.round((lonelyseatFare - fee) * 100) / 100;
}

/** Courier/freight comparison from a Lonelyseat fare. */
export function traditionalCompareFare(lonelyseatFare: number) {
  return Math.round(lonelyseatFare * 2 * 100) / 100;
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

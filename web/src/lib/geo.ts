const EARTH_RADIUS_KM = 6371;

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

/** Rough fare: base + per-km, nudged by package size. */
export function estimateFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE",
): number {
  const sizeMultiplier = { SMALL: 1, MEDIUM: 1.35, LARGE: 1.75 }[packageSize];
  const fare = (2.5 + distance * 1.2) * sizeMultiplier;
  return Math.round(fare * 100) / 100;
}

export type DemoPlace = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

/** Demo map pins around a fictional downtown (SF-ish coords for Leaflet tiles). */
export const DEMO_PLACES: DemoPlace[] = [
  {
    label: "Mission Hub",
    address: "2450 Mission St, San Francisco, CA",
    lat: 37.7599,
    lng: -122.4148,
  },
  {
    label: "SoMa Loft",
    address: "88 Townsend St, San Francisco, CA",
    lat: 37.7816,
    lng: -122.3906,
  },
  {
    label: "North Beach Cafe",
    address: "540 Columbus Ave, San Francisco, CA",
    lat: 37.7993,
    lng: -122.4082,
  },
  {
    label: "Hayes Valley",
    address: "450 Hayes St, San Francisco, CA",
    lat: 37.7765,
    lng: -122.4242,
  },
  {
    label: "Dogpatch Market",
    address: "1190 Tennessee St, San Francisco, CA",
    lat: 37.7575,
    lng: -122.3885,
  },
  {
    label: "Marina Gate",
    address: "2200 Chestnut St, San Francisco, CA",
    lat: 37.8004,
    lng: -122.4382,
  },
];

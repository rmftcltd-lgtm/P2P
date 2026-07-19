import { driverTakeFromBase, senderSeatPrice } from "@/lib/fees";
import {
  PACKAGE_SIZE_FREIGHT,
  spaceMeta,
  spaceToPackageSize,
} from "@/lib/spaces";

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

type FreightParams = {
  freightVolumeM3: number;
  freightHandling: number;
  freightPerKm: number;
};

function freightParamsForSpace(spaceOrSize: string): FreightParams {
  const meta = spaceMeta(spaceOrSize);
  if (meta) {
    return {
      freightVolumeM3: meta.freightVolumeM3,
      freightHandling: meta.freightHandling,
      freightPerKm: meta.freightPerKm,
    };
  }
  if (spaceOrSize === "SMALL" || spaceOrSize === "MEDIUM" || spaceOrSize === "LARGE") {
    return PACKAGE_SIZE_FREIGHT[spaceOrSize];
  }
  return PACKAGE_SIZE_FREIGHT[spaceToPackageSize(spaceOrSize)];
}

/**
 * NZ door-to-door **freight** guide (NZD), scaled by vehicle / space capacity.
 *
 * Anchored to published NZ domestic freight / removalist bands:
 * - Inter-city LCL-style loads ~NZ$50–$80/m³ (North Island) rising with distance
 * - Boot / awkward item door-to-door often ~$180–$250 Auckland→Christchurch
 * - Van / truck charters and FTL sit much higher than car-boot jobs
 * - Small parcels stay near light-freight / hand-carry bands (not parcel-only courier)
 *
 * Sources informing the bands: NZ removalist m³ rates, Hireace/u-save van-truck
 * hire + per-km charges, and Mainfreight-style door-to-door freight positioning.
 */
export function estimateFreightFare(distance: number, spaceOrSize: string): number {
  const { freightHandling, freightPerKm, freightVolumeM3 } =
    freightParamsForSpace(spaceOrSize);
  // Volume bump: larger cubes add handling beyond the per-km vehicle rate.
  const volumeLinehaul = freightVolumeM3 * (18 + distance * 0.04);
  const fare = freightHandling + distance * freightPerKm + volumeLinehaul;
  const floor = Math.max(22, freightHandling * 0.7);
  return Math.round(Math.max(floor, fare) * 100) / 100;
}

/** @deprecated Prefer estimateFreightFare — kept for older LARGE/MEDIUM/SMALL call sites. */
export function estimateCourierFreightFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE" | string,
): number {
  return estimateFreightFare(distance, packageSize);
}

/** @deprecated Prefer estimateFreightFare */
export function estimateTraditionalCourierFare(
  distance: number,
  packageSize: "SMALL" | "MEDIUM" | "LARGE",
) {
  return estimateFreightFare(distance, packageSize);
}

/**
 * Lonelyseat guidance relative to the freight guide above.
 * (Internally ~½ of that guide — not marketed as a fixed ratio in UI copy.)
 */
export function estimateFare(distance: number, spaceOrSize: string): number {
  const guide = estimateFreightFare(distance, spaceOrSize);
  return Math.round(Math.max(10, guide / 2) * 100) / 100;
}

/** Approximate driver take after the driver fee. */
export function estimateDriverTake(lonelyseatFare: number) {
  return driverTakeFromBase(lonelyseatFare);
}

/** What the sender pays for the seat (base fare with sender fee included). */
export function estimateSenderFare(lonelyseatFare: number) {
  return senderSeatPrice(lonelyseatFare);
}

/** Freight comparison from a Lonelyseat fare (inverse of the internal half). */
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

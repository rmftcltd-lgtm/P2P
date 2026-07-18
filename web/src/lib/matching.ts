import { prisma } from "@/lib/prisma";
import { distanceKm, ROUTE_RADIUS_KM } from "@/lib/geo";
import type { Delivery, DriverProfile } from "@/generated/prisma/client";

const DEFAULT_RADIUS_KM = ROUTE_RADIUS_KM;

export type NearbyJob = Delivery & {
  distanceFromDriverKm: number;
  customer: { id: string; name: string };
};

/** Find open jobs near a driver's current position, sorted by proximity. */
export async function findNearbyPendingJobs(
  driver: Pick<DriverProfile, "lat" | "lng">,
  radiusKm = DEFAULT_RADIUS_KM,
): Promise<NearbyJob[]> {
  if (driver.lat == null || driver.lng == null) return [];

  const pending = await prisma.delivery.findMany({
    where: { status: "PENDING" },
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return pending
    .map((job) => ({
      ...job,
      distanceFromDriverKm: distanceKm(
        driver.lat!,
        driver.lng!,
        job.pickupLat,
        job.pickupLng,
      ),
    }))
    .filter((job) => job.distanceFromDriverKm <= radiusKm)
    .sort((a, b) => a.distanceFromDriverKm - b.distanceFromDriverKm);
}

/** Online drivers within radius of a pickup point (for future push fan-out). */
export async function findNearbyDrivers(
  pickupLat: number,
  pickupLng: number,
  radiusKm = DEFAULT_RADIUS_KM,
) {
  const online = await prisma.driverProfile.findMany({
    where: {
      isOnline: true,
      lat: { not: null },
      lng: { not: null },
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
  });

  return online
    .map((d) => ({
      ...d,
      distanceKm: distanceKm(pickupLat, pickupLng, d.lat!, d.lng!),
    }))
    .filter((d) => d.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { findNearbyPendingJobs } from "@/lib/matching";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const session = await requireSession(["DRIVER"]);
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: session.id },
    });
    if (!driver) return jsonError("Driver profile missing", 400);

    const { searchParams } = new URL(req.url);
    const radius = Number(searchParams.get("radiusKm") ?? 50);

    const jobs = await findNearbyPendingJobs(driver, radius);
    return jsonOk({
      jobs,
      driver: {
        isOnline: driver.isOnline,
        lat: driver.lat,
        lng: driver.lng,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

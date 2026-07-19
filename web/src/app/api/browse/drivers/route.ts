import { prisma } from "@/lib/prisma";
import { getSession, requireSession } from "@/lib/auth";
import { browseQuerySchema } from "@/lib/validators";
import { distanceKm } from "@/lib/geo";
import { handleApiError, jsonOk } from "@/lib/api";

function inDateWindow(departAt: Date, window: string) {
  if (window === "flexible") return true;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (window === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return departAt >= start && departAt < end;
  }
  if (window === "tomorrow") {
    const t0 = new Date(start);
    t0.setDate(t0.getDate() + 1);
    const t1 = new Date(t0);
    t1.setDate(t1.getDate() + 1);
    return departAt >= t0 && departAt < t1;
  }
  // week
  const end = new Date(start);
  end.setDate(end.getDate() + (7 - end.getDay()));
  end.setHours(23, 59, 59, 999);
  return departAt >= start && departAt <= end;
}

/** Browse Empty Space — sender discovers driver trips (wireframe search). */
export async function GET(req: Request) {
  try {
    // Guest browse allowed (wireframe Register/Sign in on search)
    await getSession().catch(() => null);
    const url = new URL(req.url);
    const q = browseQuerySchema.parse(Object.fromEntries(url.searchParams));

    const trips = await prisma.driverTrip.findMany({
      where: {
        status: "OPEN",
        departAt: { gte: new Date(Date.now() - 86400000) },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            driver: { select: { rating: true, completedCount: true, vehicleType: true } },
          },
        },
      },
      take: 80,
      orderBy: { createdAt: "desc" },
    });

    let filtered = trips.filter((t) => {
      if (q.space) {
        try {
          const spaces = JSON.parse(t.spaces) as string[];
          if (!spaces.includes(q.space)) return false;
        } catch {
          return false;
        }
      }
      if (!inDateWindow(t.departAt, q.date)) return false;
      if (q.fromLat != null && q.fromLng != null) {
        if (distanceKm(q.fromLat, q.fromLng, t.fromLat, t.fromLng) > q.radiusKm) {
          return false;
        }
      }
      if (q.toLat != null && q.toLng != null) {
        if (distanceKm(q.toLat, q.toLng, t.toLat, t.toLng) > q.radiusKm) {
          return false;
        }
      }
      return true;
    });

    if (q.sort === "oldest") {
      filtered = filtered.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    } else if (q.sort === "depart") {
      filtered = filtered.sort(
        (a, b) => a.departAt.getTime() - b.departAt.getTime(),
      );
    } else if (q.sort === "price") {
      filtered = filtered.sort(
        (a, b) => (a.listedPrice ?? 9999) - (b.listedPrice ?? 9999),
      );
    } else if (q.sort === "reviews") {
      filtered = filtered.sort(
        (a, b) =>
          (b.driver.driver?.rating ?? 0) - (a.driver.driver?.rating ?? 0),
      );
    }

    return jsonOk({
      trips: filtered.slice(0, 40).map((t) => ({
        ...t,
        spaces: JSON.parse(t.spaces || "[]"),
        rating: t.driver.driver?.rating ?? 5,
        reviewCount: t.driver.driver?.completedCount ?? 0,
        vehicleType: t.driver.driver?.vehicleType ?? t.vehicleType,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Authed alias used by dashboards */
export async function POST() {
  await requireSession();
  return jsonOk({ ok: true });
}

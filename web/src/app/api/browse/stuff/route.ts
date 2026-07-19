import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { browseQuerySchema } from "@/lib/validators";
import { distanceKm } from "@/lib/geo";
import { inUrgencyWindow } from "@/lib/urgency";
import { handleApiError, jsonOk } from "@/lib/api";

/** Stuff Listing — drivers browse open items (wireframe Search Stuff). */
export async function GET(req: Request) {
  try {
    await getSession().catch(() => null);
    const url = new URL(req.url);
    const q = browseQuerySchema.parse(Object.fromEntries(url.searchParams));
    const urgency = q.urgency ?? q.date;

    const deliveries = await prisma.delivery.findMany({
      where: { status: "PENDING", driverId: null },
      include: {
        customer: { select: { id: true, name: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    let filtered = deliveries.filter((d) => {
      if (q.space && d.spaceNeeded !== q.space) return false;
      if (urgency !== "flexible") {
        const matchesField =
          d.urgency === urgency || (urgency === "week" && d.urgency === "today");
        const matchesDate = inUrgencyWindow(d.preferredDate, urgency);
        if (!matchesField && !matchesDate) return false;
      }
      if (q.fromLat != null && q.fromLng != null) {
        if (distanceKm(q.fromLat, q.fromLng, d.pickupLat, d.pickupLng) > q.radiusKm) {
          return false;
        }
      }
      if (q.toLat != null && q.toLng != null) {
        if (distanceKm(q.toLat, q.toLng, d.dropoffLat, d.dropoffLng) > q.radiusKm) {
          return false;
        }
      }
      return true;
    });

    if (q.sort === "price") {
      filtered = filtered.sort((a, b) => a.offerAmount - b.offerAmount);
    } else if (q.sort === "oldest") {
      filtered = filtered.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    }

    return jsonOk({
      stuff: filtered.slice(0, 40).map((d) => ({
        id: d.id,
        requestCode: d.requestCode,
        itemTitle: d.itemTitle ?? "Item",
        pickupAddress: d.pickupAddress,
        dropoffAddress: d.dropoffAddress,
        pickupLat: d.pickupLat,
        pickupLng: d.pickupLng,
        dropoffLat: d.dropoffLat,
        dropoffLng: d.dropoffLng,
        spaceNeeded: d.spaceNeeded,
        offerAmount: d.offerAmount,
        distanceKm: d.distanceKm,
        preferredDate: d.preferredDate,
        urgency: d.urgency,
        marketplaceUrl: d.marketplaceUrl,
        createdAt: d.createdAt,
        customerName: d.customer.name,
        offerCount: d._count.offers,
        fullyPackaged: d.fullyPackaged,
        greetAtPickup: d.greetAtPickup,
        greetAtDropoff: d.greetAtDropoff,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

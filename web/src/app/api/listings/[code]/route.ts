import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { urgencyLabel } from "@/lib/urgency";
import { spaceMeta } from "@/lib/spaces";
import { suburbCity } from "@/lib/privacy";

type Params = { params: Promise<{ code: string }> };

/** Public listing by request code — safe fields only for share / TradeMe handoff. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { code } = await params;
    const requestCode = code.replace(/^#/, "").trim();
    if (!requestCode) return jsonError("Missing listing code", 400);

    const delivery = await prisma.delivery.findUnique({
      where: { requestCode },
      include: {
        customer: { select: { name: true } },
        _count: { select: { offers: true } },
      },
    });
    if (!delivery) return jsonError("Listing not found", 404);
    if (delivery.status === "CANCELLED" || delivery.status === "DELIVERED") {
      return jsonError("This listing is no longer open", 410);
    }

    const open = delivery.status === "PENDING" && !delivery.driverId;

    return jsonOk({
      listing: {
        requestCode: delivery.requestCode,
        itemTitle: delivery.itemTitle ?? "Item",
        pickupCity: suburbCity(delivery.pickupAddress),
        dropoffCity: suburbCity(delivery.dropoffAddress),
        pickupLat: delivery.pickupLat,
        pickupLng: delivery.pickupLng,
        dropoffLat: delivery.dropoffLat,
        dropoffLng: delivery.dropoffLng,
        spaceNeeded: delivery.spaceNeeded,
        spaceLabel: spaceMeta(delivery.spaceNeeded)?.label ?? delivery.spaceNeeded,
        offerAmount: delivery.offerAmount,
        urgency: delivery.urgency,
        urgencyLabel: urgencyLabel(delivery.urgency),
        marketplaceUrl: delivery.marketplaceUrl,
        open,
        offerCount: delivery._count.offers,
        customerFirstName: delivery.customer.name.split(" ")[0] ?? "Sender",
        createdAt: delivery.createdAt,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

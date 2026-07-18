import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { respondOfferSchema } from "@/lib/validators";
import { publishDeliveryUpdated } from "@/lib/events";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * Accept/reject an offer.
 * Accepting assigns the driver and auto-rejects sibling offers (wireframe rule).
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = respondOfferSchema.parse(await req.json());

    const offer = await prisma.deliveryOffer.findUnique({
      where: { id },
      include: { delivery: true },
    });
    if (!offer) return jsonError("Offer not found", 404);
    if (offer.status !== "PENDING") {
      return jsonError("Offer is no longer pending", 409);
    }
    if (offer.toUserId !== session.id) {
      return jsonError("Only the recipient can respond to this offer", 403);
    }

    if (body.action === "reject") {
      const updated = await prisma.deliveryOffer.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      await prisma.deliveryEvent.create({
        data: {
          deliveryId: offer.deliveryId,
          status: "PENDING",
          note: `${session.name} declined an offer`,
        },
      });
      return jsonOk({ offer: updated });
    }

    const result = await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id: offer.deliveryId },
      });
      if (!delivery || delivery.status !== "PENDING") {
        return { error: "Delivery is no longer available", status: 409 as const };
      }

      const active = await tx.delivery.count({
        where: {
          driverId: offer.driverId,
          status: { in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT"] },
        },
      });
      if (active > 0) {
        return {
          error: "Driver already has an active delivery",
          status: 409 as const,
        };
      }

      await tx.deliveryOffer.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });

      // Wireframe: accepting one offer auto-rejects the rest for this request
      await tx.deliveryOffer.updateMany({
        where: {
          deliveryId: offer.deliveryId,
          id: { not: id },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      const updated = await tx.delivery.update({
        where: { id: offer.deliveryId },
        data: {
          status: "ACCEPTED",
          driverId: offer.driverId,
          acceptedAt: new Date(),
          offerAmount: offer.amount,
          events: {
            create: {
              status: "ACCEPTED",
              note: `${session.name} accepted the offer`,
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true } },
          driver: { select: { id: true, name: true } },
          offers: true,
          events: { orderBy: { createdAt: "asc" } },
        },
      });

      return { delivery: updated };
    });

    if ("error" in result && result.error) {
      return jsonError(result.error, result.status);
    }

    const delivery = result.delivery!;
    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: delivery.id,
      status: delivery.status,
      customerId: delivery.customerId,
      driverId: delivery.driverId,
    });

    return jsonOk({ delivery, message: "Offer accepted — other offers rejected" });
  } catch (err) {
    return handleApiError(err);
  }
}

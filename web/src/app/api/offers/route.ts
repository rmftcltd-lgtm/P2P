import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createOfferSchema, respondOfferSchema } from "@/lib/validators";
import { publishDeliveryUpdated } from "@/lib/events";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { notifyOfferCreated } from "@/lib/notify-events";
import { requireCompleteRegistration } from "@/lib/profile-gate";
import { offerDeadline } from "@/lib/offer-sla";
import { suburbCity } from "@/lib/privacy";

/** Driver offers to carry an open stuff listing (wireframe Book Now). */
export async function POST(req: Request) {
  try {
    const gate = await requireCompleteRegistration();
    if (gate.incomplete) return gate.response!;
    if (gate.session.role !== "DRIVER") {
      return jsonError("Driver account required", 403);
    }
    const session = gate.session;
    const body = createOfferSchema.parse(await req.json());

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: session.id },
    });
    if (!driver) return jsonError("Driver profile missing", 400);
    if (driver.kycStatus === "UNVERIFIED" || driver.kycStatus === "REJECTED") {
      return jsonError("Complete driver verification before offering", 403);
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: body.deliveryId },
      include: { customer: true },
    });
    if (!delivery) return jsonError("Delivery not found", 404);
    if (delivery.status !== "PENDING") {
      return jsonError("Delivery is no longer open for offers", 409);
    }

    const existing = await prisma.deliveryOffer.findFirst({
      where: {
        deliveryId: delivery.id,
        driverId: session.id,
        status: "PENDING",
      },
    });
    if (existing) return jsonError("You already have a pending offer", 409);

    const offer = await prisma.deliveryOffer.create({
      data: {
        deliveryId: delivery.id,
        fromUserId: session.id,
        toUserId: delivery.customerId,
        driverId: session.id,
        initiator: "DRIVER",
        amount: body.amount ?? delivery.offerAmount,
        note: body.note ?? `${session.name} offered to drive your stuff`,
      },
    });

    await prisma.deliveryEvent.create({
      data: {
        deliveryId: delivery.id,
        status: "PENDING",
        note: `${session.name} offered to drive your ${delivery.itemTitle ?? "item"}`,
      },
    });

    void notifyOfferCreated({
      to: delivery.customer,
      fromName: session.name,
      requestCode: delivery.requestCode,
      deliveryId: delivery.id,
      itemTitle: delivery.itemTitle,
      initiator: "DRIVER",
      details: {
        requestCode: delivery.requestCode,
        itemTitle: delivery.itemTitle,
        pickupAddress: delivery.pickupAddress,
        dropoffAddress: delivery.dropoffAddress,
        spaceNeeded: delivery.spaceNeeded,
        offerAmount: body.amount ?? delivery.offerAmount,
        preferredDate: delivery.preferredDate,
        preferredDropoffDate: delivery.preferredDropoffDate,
        packageNotes: delivery.packageNotes,
      },
    });

    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: delivery.id,
      status: delivery.status,
      customerId: delivery.customerId,
      driverId: session.id,
    });

    return jsonOk(
      {
        offer: {
          ...offer,
          expiresAt: offerDeadline(offer.createdAt).toISOString(),
          confirmWithinMinutes: 30,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}

/** List offers for the current user (inbox). */
export async function GET() {
  try {
    const session = await requireSession();
    const offers = await prisma.deliveryOffer.findMany({
      where: {
        OR: [{ fromUserId: session.id }, { toUserId: session.id }],
      },
      include: {
        delivery: {
          select: {
            id: true,
            requestCode: true,
            itemTitle: true,
            status: true,
            pickupAddress: true,
            dropoffAddress: true,
            spaceNeeded: true,
            offerAmount: true,
          },
        },
        fromUser: { select: { id: true, name: true, role: true } },
        toUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonOk({
      offers: offers.map((o) => ({
        ...o,
        delivery: {
          ...o.delivery,
          pickupAddress: suburbCity(o.delivery.pickupAddress),
          dropoffAddress: suburbCity(o.delivery.dropoffAddress),
        },
        expiresAt: offerDeadline(o.createdAt).toISOString(),
        confirmWithinMinutes: 30,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export { respondOfferSchema };

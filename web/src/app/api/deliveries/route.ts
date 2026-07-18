import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createDeliverySchema } from "@/lib/validators";
import { distanceKm, estimateFare } from "@/lib/geo";
import { spaceToPackageSize, LONELY_COVER_FEE } from "@/lib/spaces";
import { publishDeliveryCreated } from "@/lib/events";
import { platformFeeFromOffer } from "@/lib/payments";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession();
    const where =
      session.role === "CUSTOMER"
        ? { customerId: session.id }
        : { driverId: session.id };

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        trip: true,
        events: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ deliveries });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const body = createDeliverySchema.parse(await req.json());
    const packageSize =
      body.packageSize ?? spaceToPackageSize(body.spaceNeeded);
    const distance = distanceKm(
      body.pickupLat,
      body.pickupLng,
      body.dropoffLat,
      body.dropoffLng,
    );
    const offerAmount = estimateFare(distance, packageSize);
    const platformFee = platformFeeFromOffer(offerAmount);
    const lonelyCover = Boolean(body.lonelyCover);
    const lonelyCoverFee = lonelyCover ? LONELY_COVER_FEE : 0;

    const delivery = await prisma.delivery.create({
      data: {
        customerId: session.id,
        tripId: body.tripId,
        pickupAddress: body.pickupAddress,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        dropoffAddress: body.dropoffAddress,
        dropoffLat: body.dropoffLat,
        dropoffLng: body.dropoffLng,
        preferredDate: body.preferredDate ? new Date(body.preferredDate) : null,
        packageSize,
        spaceNeeded: body.spaceNeeded,
        packageNotes: body.packageNotes,
        distanceKm: Math.round(distance * 100) / 100,
        offerAmount: offerAmount + lonelyCoverFee,
        platformFee,
        lonelyCover,
        lonelyCoverFee,
        paymentStatus: "REQUIRES_PAYMENT",
        events: {
          create: {
            status: "PENDING",
            note: lonelyCover
              ? "Item listed with Lonely Cover"
              : "Item listed for delivery",
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        events: true,
      },
    });

    publishDeliveryCreated({
      type: "delivery.created",
      deliveryId: delivery.id,
      pickupLat: delivery.pickupLat,
      pickupLng: delivery.pickupLng,
      offerAmount: delivery.offerAmount,
    });

    return jsonOk({ delivery }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

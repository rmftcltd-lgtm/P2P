import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createDeliverySchema } from "@/lib/validators";
import { distanceKm, estimateFare } from "@/lib/geo";
import { spaceToPackageSize, LONELY_COVER_FEE } from "@/lib/spaces";
import { publishDeliveryCreated, publishDeliveryUpdated } from "@/lib/events";
import { platformFeeFromOffer } from "@/lib/payments";
import { senderSeatPrice } from "@/lib/fees";
import { makeRequestCode } from "@/lib/request-code";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

async function uniqueRequestCode() {
  for (let i = 0; i < 8; i++) {
    const code = makeRequestCode();
    const hit = await prisma.delivery.findUnique({ where: { requestCode: code } });
    if (!hit) return code;
  }
  return `${makeRequestCode()}${Date.now().toString().slice(-2)}`;
}

function donationTotal(base: number, brake: boolean, trees: boolean) {
  let d = 0;
  if (brake) d += Math.round(base * 0.01 * 100) / 100;
  if (trees) d += Math.round(base * 0.01 * 100) / 100;
  return d;
}

export async function GET() {
  try {
    const session = await requireSession();
    const where =
      session.role === "CUSTOMER"
        ? { customerId: session.id }
        : {
            OR: [
              { driverId: session.id },
              { offers: { some: { driverId: session.id } } },
            ],
          };

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        trip: true,
        offers: { orderBy: { createdAt: "desc" } },
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
    const baseFare = estimateFare(distance, packageSize);
    const lonelyCover = Boolean(body.lonelyCover);
    const lonelyCoverFee = lonelyCover ? LONELY_COVER_FEE : 0;
    const donateBrake = Boolean(body.donateBrake);
    const donateTrees = Boolean(body.donateTrees);
    const donationAmount = donationTotal(baseFare, donateBrake, donateTrees);
    const seatPrice = senderSeatPrice(baseFare);
    const offerAmount = seatPrice + lonelyCoverFee + donationAmount;
    const platformFee = platformFeeFromOffer(baseFare);

    let tripDriverId: string | undefined;
    if (body.tripId) {
      const trip = await prisma.driverTrip.findUnique({ where: { id: body.tripId } });
      if (!trip || trip.status !== "OPEN") {
        return jsonError("That lonely seat listing is not available", 404);
      }
      tripDriverId = trip.driverId;
    }
    if (body.requestDriverId) tripDriverId = body.requestDriverId;

    const delivery = await prisma.delivery.create({
      data: {
        requestCode: await uniqueRequestCode(),
        customerId: session.id,
        tripId: body.tripId,
        pickupAddress: body.pickupAddress,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        dropoffAddress: body.dropoffAddress,
        dropoffLat: body.dropoffLat,
        dropoffLng: body.dropoffLng,
        preferredDate: body.preferredDate ? new Date(body.preferredDate) : null,
        preferredDropoffDate: body.preferredDropoffDate
          ? new Date(body.preferredDropoffDate)
          : null,
        packageSize,
        spaceNeeded: body.spaceNeeded,
        itemTitle: body.itemTitle,
        packageNotes: body.packageNotes,
        timePreference: body.timePreference,
        lengthCm: body.lengthCm,
        widthCm: body.widthCm,
        fullyPackaged: Boolean(body.fullyPackaged),
        greetAtPickup: Boolean(body.greetAtPickup),
        greetAtDropoff: Boolean(body.greetAtDropoff),
        distanceKm: Math.round(distance * 100) / 100,
        offerAmount,
        platformFee,
        lonelyCover,
        lonelyCoverFee,
        donateBrake,
        donateTrees,
        donationAmount,
        paymentStatus: "REQUIRES_PAYMENT",
        events: {
          create: {
            status: "PENDING",
            note: tripDriverId
              ? `Stuff delivery request sent to driver`
              : lonelyCover
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

    let offer = null;
    if (tripDriverId) {
      const driverUser = await prisma.user.findUnique({ where: { id: tripDriverId } });
      offer = await prisma.deliveryOffer.create({
        data: {
          deliveryId: delivery.id,
          fromUserId: session.id,
          toUserId: tripDriverId,
          driverId: tripDriverId,
          initiator: "SENDER",
          amount: offerAmount,
          note: body.itemTitle
            ? `Request to carry: ${body.itemTitle}`
            : "Sender requested this lonely seat",
        },
      });
      if (driverUser) {
        const { notifyOfferCreated } = await import("@/lib/notify-events");
        void notifyOfferCreated({
          to: driverUser,
          fromName: session.name,
          requestCode: delivery.requestCode,
          deliveryId: delivery.id,
          itemTitle: body.itemTitle,
          initiator: "SENDER",
          details: {
            requestCode: delivery.requestCode,
            itemTitle: delivery.itemTitle,
            pickupAddress: delivery.pickupAddress,
            dropoffAddress: delivery.dropoffAddress,
            spaceNeeded: delivery.spaceNeeded,
            offerAmount: delivery.offerAmount,
            preferredDate: delivery.preferredDate,
            preferredDropoffDate: delivery.preferredDropoffDate,
            packageNotes: delivery.packageNotes,
          },
        });
      }
      publishDeliveryUpdated({
        type: "delivery.updated",
        deliveryId: delivery.id,
        status: delivery.status,
        customerId: delivery.customerId,
        driverId: tripDriverId,
      });
    }

    publishDeliveryCreated({
      type: "delivery.created",
      deliveryId: delivery.id,
      pickupLat: delivery.pickupLat,
      pickupLng: delivery.pickupLng,
      offerAmount: delivery.offerAmount,
    });

    return jsonOk({ delivery, offer }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

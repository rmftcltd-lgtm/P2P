import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { statusSchema } from "@/lib/validators";
import { canTransition } from "@/lib/delivery-status";
import { publishDeliveryUpdated } from "@/lib/events";
import {
  capturePaymentForDelivery,
  driverPayoutFromDelivery,
} from "@/lib/payments";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { notifyStatusChange } from "@/lib/notify-events";
import { toBookingDetails } from "@/lib/booking-email";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = statusSchema.parse(await req.json());

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) return jsonError("Delivery not found", 404);

    const isCustomer = delivery.customerId === session.id;
    const isDriver = delivery.driverId === session.id;

    if (body.status === "CANCELLED") {
      if (!isCustomer && !isDriver) return jsonError("Forbidden", 403);
      if (!canTransition(delivery.status, "CANCELLED")) {
        return jsonError("Cannot cancel at this stage", 400);
      }
    } else {
      if (!isDriver || session.role !== "DRIVER") {
        return jsonError("Only the assigned driver can update status", 403);
      }
      if (!canTransition(delivery.status, body.status)) {
        return jsonError(
          `Cannot move from ${delivery.status} to ${body.status}`,
          400,
        );
      }
    }

    const timestamps: Record<string, Date> = {};
    if (body.status === "PICKED_UP") timestamps.pickedUpAt = new Date();
    if (body.status === "DELIVERED") timestamps.deliveredAt = new Date();
    if (body.status === "CANCELLED") timestamps.cancelledAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.delivery.update({
        where: { id },
        data: {
          status: body.status,
          ...timestamps,
          ...(body.status === "PICKED_UP" && body.pickupPhotoUrl
            ? { pickupPhotoUrl: body.pickupPhotoUrl }
            : {}),
          ...(body.status === "DELIVERED" && body.dropoffPhotoUrl
            ? { dropoffPhotoUrl: body.dropoffPhotoUrl }
            : {}),
          events: {
            create: {
              status: body.status,
              note:
                body.note ??
                (body.status === "PICKED_UP" && body.pickupPhotoUrl
                  ? "Item picked up — photo attached"
                  : body.status === "DELIVERED" && body.dropoffPhotoUrl
                    ? "Delivered with drop-off photo"
                    : body.status === "PICKED_UP"
                      ? "Driver has picked up your item"
                      : undefined),
              lat: body.lat,
              lng: body.lng,
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          driver: { select: { id: true, name: true, email: true, phone: true } },
          events: { orderBy: { createdAt: "asc" } },
        },
      });

      if (body.status === "DELIVERED" && delivery.driverId) {
        await tx.driverProfile.update({
          where: { userId: delivery.driverId },
          data: { completedCount: { increment: 1 } },
        });
      }

      return next;
    });

    let payoutAmount: number | undefined;
    if (body.status === "DELIVERED") {
      const paid = await capturePaymentForDelivery(updated.id);
      if (paid.payoutStatus === "PAID") {
        payoutAmount = driverPayoutFromDelivery(paid);
      }
    }

    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: updated.id,
      status: updated.status,
      customerId: updated.customerId,
      driverId: updated.driverId,
    });

    void notifyStatusChange({
      sender: updated.customer,
      driver: updated.driver,
      requestCode: updated.requestCode,
      status: updated.status,
      deliveryId: updated.id,
      note: body.note,
      details: toBookingDetails(updated, updated.driver),
      payoutAmount,
    });

    const fresh = await prisma.delivery.findUnique({
      where: { id: updated.id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        events: { orderBy: { createdAt: "asc" } },
        rating: true,
      },
    });

    return jsonOk({ delivery: fresh });
  } catch (err) {
    return handleApiError(err);
  }
}

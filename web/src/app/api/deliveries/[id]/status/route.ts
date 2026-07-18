import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { statusSchema } from "@/lib/validators";
import { canTransition } from "@/lib/delivery-status";
import { publishDeliveryUpdated } from "@/lib/events";
import { capturePaymentForDelivery } from "@/lib/payments";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

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
          events: {
            create: {
              status: body.status,
              note: body.note,
              lat: body.lat,
              lng: body.lng,
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          driver: { select: { id: true, name: true, phone: true } },
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

    if (body.status === "DELIVERED") {
      await capturePaymentForDelivery(updated.id);
    }

    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: updated.id,
      status: updated.status,
      customerId: updated.customerId,
      driverId: updated.driverId,
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

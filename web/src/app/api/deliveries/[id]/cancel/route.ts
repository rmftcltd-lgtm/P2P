import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { cancelSchema, cancelRespondSchema } from "@/lib/validators";
import { publishDeliveryUpdated } from "@/lib/events";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * Mutual: request other party to approve (refundable if accepted).
 * Forced: immediate cancel, no refund (wireframe).
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = cancelSchema.parse(await req.json());

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) return jsonError("Delivery not found", 404);

    const isParty =
      delivery.customerId === session.id || delivery.driverId === session.id;
    if (!isParty) return jsonError("Forbidden", 403);

    if (!["PENDING", "ACCEPTED"].includes(delivery.status)) {
      return jsonError("Cannot cancel at this stage", 409);
    }

    if (body.mode === "FORCED") {
      const updated = await prisma.delivery.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationMode: "FORCED",
          cancellationStatus: "ACCEPTED",
          cancellationReason: body.reason,
          cancellationById: session.id,
          // Forced = no refund
          paymentStatus:
            delivery.paymentStatus === "AUTHORIZED" ||
            delivery.paymentStatus === "CAPTURED"
              ? delivery.paymentStatus
              : "FAILED",
          events: {
            create: {
              status: "CANCELLED",
              note: `Forced cancellation (no refund): ${body.reason}`,
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true } },
          driver: { select: { id: true, name: true } },
          events: { orderBy: { createdAt: "asc" } },
        },
      });

      publishDeliveryUpdated({
        type: "delivery.updated",
        deliveryId: updated.id,
        status: updated.status,
        customerId: updated.customerId,
        driverId: updated.driverId,
      });

      return jsonOk({ delivery: updated });
    }

    // Mutual — needs the other party
    if (!delivery.driverId && delivery.status === "PENDING") {
      // No driver yet: mutual cancel is immediate + refundable
      const updated = await prisma.delivery.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationMode: "MUTUAL",
          cancellationStatus: "ACCEPTED",
          cancellationReason: body.reason,
          cancellationById: session.id,
          paymentStatus:
            delivery.paymentStatus === "AUTHORIZED" ? "REFUNDED" : delivery.paymentStatus,
          events: {
            create: {
              status: "CANCELLED",
              note: `Cancelled before match: ${body.reason}`,
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true } },
          driver: { select: { id: true, name: true } },
          events: { orderBy: { createdAt: "asc" } },
        },
      });
      publishDeliveryUpdated({
        type: "delivery.updated",
        deliveryId: updated.id,
        status: updated.status,
        customerId: updated.customerId,
        driverId: updated.driverId,
      });
      return jsonOk({ delivery: updated });
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        cancellationMode: "MUTUAL",
        cancellationStatus: "REQUESTED",
        cancellationReason: body.reason,
        cancellationById: session.id,
        events: {
          create: {
            status: delivery.status,
            note: `${session.name} requested mutual cancellation: ${body.reason}`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: updated.id,
      status: updated.status,
      customerId: updated.customerId,
      driverId: updated.driverId,
    });

    return jsonOk({
      delivery: updated,
      message: "Cancellation request sent to the other party",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Other party accepts/rejects a mutual cancellation request. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = cancelRespondSchema.parse(await req.json());

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) return jsonError("Delivery not found", 404);
    if (delivery.cancellationStatus !== "REQUESTED") {
      return jsonError("No pending cancellation request", 409);
    }
    if (delivery.cancellationById === session.id) {
      return jsonError("Wait for the other party to respond", 403);
    }
    const isParty =
      delivery.customerId === session.id || delivery.driverId === session.id;
    if (!isParty) return jsonError("Forbidden", 403);

    if (body.action === "reject") {
      const updated = await prisma.delivery.update({
        where: { id },
        data: {
          cancellationStatus: "REJECTED",
          events: {
            create: {
              status: delivery.status,
              note: `${session.name} rejected the cancellation request`,
            },
          },
        },
      });
      return jsonOk({ delivery: updated });
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationStatus: "ACCEPTED",
        paymentStatus:
          delivery.paymentStatus === "AUTHORIZED" ? "REFUNDED" : delivery.paymentStatus,
        events: {
          create: {
            status: "CANCELLED",
            note: `${session.name} accepted mutual cancellation`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: updated.id,
      status: updated.status,
      customerId: updated.customerId,
      driverId: updated.driverId,
    });

    return jsonOk({ delivery: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

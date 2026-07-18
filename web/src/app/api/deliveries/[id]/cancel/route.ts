import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { cancelSchema, cancelRespondSchema } from "@/lib/validators";
import { publishDeliveryUpdated } from "@/lib/events";
import { reversePaymentForDelivery } from "@/lib/payments";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { notifyCancellation } from "@/lib/notify-events";

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

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { customer: true, driver: true },
    });
    if (!delivery) return jsonError("Delivery not found", 404);

    const isParty =
      delivery.customerId === session.id || delivery.driverId === session.id;
    if (!isParty) return jsonError("Forbidden", 403);

    if (!["PENDING", "ACCEPTED"].includes(delivery.status)) {
      return jsonError("Cannot cancel at this stage", 409);
    }

    const partySelect = {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      driver: { select: { id: true, name: true, email: true, phone: true } },
      events: { orderBy: { createdAt: "asc" as const } },
    };

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
        include: partySelect,
      });

      // Forced keeps funds — do not reverse Stripe
      publishDeliveryUpdated({
        type: "delivery.updated",
        deliveryId: updated.id,
        status: updated.status,
        customerId: updated.customerId,
        driverId: updated.driverId,
      });

      const other =
        session.id === delivery.customerId ? updated.driver : updated.customer;
      if (other) {
        void notifyCancellation({
          to: other,
          requestCode: updated.requestCode,
          deliveryId: updated.id,
          mode: "Forced",
          reason: body.reason,
        });
      }

      return jsonOk({ delivery: updated });
    }

    // Mutual — no driver yet: immediate + refund
    if (!delivery.driverId && delivery.status === "PENDING") {
      await reversePaymentForDelivery(id, { refund: true });
      const updated = await prisma.delivery.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationMode: "MUTUAL",
          cancellationStatus: "ACCEPTED",
          cancellationReason: body.reason,
          cancellationById: session.id,
          paymentStatus: "REFUNDED",
          events: {
            create: {
              status: "CANCELLED",
              note: `Cancelled before match: ${body.reason}`,
            },
          },
        },
        include: partySelect,
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
      include: partySelect,
    });

    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: updated.id,
      status: updated.status,
      customerId: updated.customerId,
      driverId: updated.driverId,
    });

    const other =
      session.id === delivery.customerId ? updated.driver : updated.customer;
    if (other) {
      void notifyCancellation({
        to: other,
        requestCode: updated.requestCode,
        deliveryId: updated.id,
        mode: "Mutual",
        reason: body.reason,
      });
    }

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

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { customer: true, driver: true },
    });
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

    await reversePaymentForDelivery(id, { refund: true });

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationStatus: "ACCEPTED",
        paymentStatus: "REFUNDED",
        events: {
          create: {
            status: "CANCELLED",
            note: `${session.name} accepted mutual cancellation`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        driver: { select: { id: true, name: true, email: true, phone: true } },
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

    void notifyCancellation({
      to: updated.customer,
      requestCode: updated.requestCode,
      deliveryId: updated.id,
      mode: "Mutual (accepted)",
      reason: delivery.cancellationReason ?? "Agreed cancellation",
    });
    if (updated.driver) {
      void notifyCancellation({
        to: updated.driver,
        requestCode: updated.requestCode,
        deliveryId: updated.id,
        mode: "Mutual (accepted)",
        reason: delivery.cancellationReason ?? "Agreed cancellation",
      });
    }

    return jsonOk({ delivery: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

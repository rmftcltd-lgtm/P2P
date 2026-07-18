import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import {
  createPaymentIntentForDelivery,
  markPaymentAuthorized,
  stripeEnabled,
} from "@/lib/payments";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { notifyPaymentAuthorized } from "@/lib/notify-events";
import { publishDeliveryUpdated } from "@/lib/events";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const { id } = await params;

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) return jsonError("Delivery not found", 404);
    if (delivery.customerId !== session.id) return jsonError("Forbidden", 403);
    if (["AUTHORIZED", "CAPTURED"].includes(delivery.paymentStatus)) {
      return jsonError("Already paid", 409);
    }

    const intent = await createPaymentIntentForDelivery(id);

    if (intent.mode === "mock") {
      const full = await prisma.delivery.findUnique({
        where: { id },
        include: {
          customer: true,
          driver: true,
        },
      });
      if (full) {
        void notifyPaymentAuthorized({
          sender: full.customer,
          driver: full.driver,
          requestCode: full.requestCode,
          amount: full.offerAmount,
          deliveryId: full.id,
        });
        publishDeliveryUpdated({
          type: "delivery.updated",
          deliveryId: full.id,
          status: full.status,
          customerId: full.customerId,
          driverId: full.driverId,
        });
      }
    }

    return jsonOk({
      ...intent,
      stripeEnabled: stripeEnabled(),
      message:
        intent.mode === "mock"
          ? "Mock payment authorized (add Stripe keys for live card payments)."
          : "Confirm the Payment Element to authorize funds.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Confirm authorized payment after Stripe.js confirmation (or webhook). */
export async function PATCH(_req: Request, { params }: Params) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const { id } = await params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { customer: true, driver: true },
    });
    if (!delivery) return jsonError("Delivery not found", 404);
    if (delivery.customerId !== session.id) return jsonError("Forbidden", 403);

    const updated = await markPaymentAuthorized(id);
    void notifyPaymentAuthorized({
      sender: delivery.customer,
      driver: delivery.driver,
      requestCode: delivery.requestCode,
      amount: delivery.offerAmount,
      deliveryId: delivery.id,
    });
    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: delivery.id,
      status: delivery.status,
      customerId: delivery.customerId,
      driverId: delivery.driverId,
    });

    return jsonOk({ delivery: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

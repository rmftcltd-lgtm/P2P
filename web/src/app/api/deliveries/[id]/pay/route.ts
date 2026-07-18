import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import {
  createPaymentIntentForDelivery,
  markPaymentAuthorized,
  stripeEnabled,
} from "@/lib/payments";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const { id } = await params;

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) return jsonError("Delivery not found", 404);
    if (delivery.customerId !== session.id) return jsonError("Forbidden", 403);

    const intent = await createPaymentIntentForDelivery(id);
    return jsonOk({
      ...intent,
      stripeEnabled: stripeEnabled(),
      message:
        intent.mode === "mock"
          ? "Mock payment authorized (set STRIPE_SECRET_KEY for live Stripe)."
          : "Use clientSecret with Stripe.js to confirm payment.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Confirm mock/authorized payment after client-side confirmation. */
export async function PATCH(_req: Request, { params }: Params) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const { id } = await params;
    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) return jsonError("Delivery not found", 404);
    if (delivery.customerId !== session.id) return jsonError("Forbidden", 403);

    const updated = await markPaymentAuthorized(id);
    return jsonOk({ delivery: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

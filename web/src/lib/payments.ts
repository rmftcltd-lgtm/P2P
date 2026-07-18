import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const PLATFORM_FEE_RATE = 0.15;

export function platformFeeFromOffer(offerAmount: number) {
  return Math.round(offerAmount * PLATFORM_FEE_RATE * 100) / 100;
}

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export type PaymentIntentResult = {
  mode: "stripe" | "mock";
  clientSecret: string | null;
  paymentIntentId: string;
  amount: number;
  currency: string;
  paymentStatus: string;
};

/** Authorize payment for a delivery (customer pays offerAmount). */
export async function createPaymentIntentForDelivery(
  deliveryId: string,
): Promise<PaymentIntentResult> {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new Error("Delivery not found");

  const amountCents = Math.round(delivery.offerAmount * 100);
  const stripe = getStripe();

  if (!stripe) {
    const mockId = `pi_mock_${deliveryId}`;
    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        stripePaymentIntentId: mockId,
        paymentStatus: "AUTHORIZED",
        platformFee: platformFeeFromOffer(delivery.offerAmount),
      },
    });
    return {
      mode: "mock",
      clientSecret: null,
      paymentIntentId: mockId,
      amount: updated.offerAmount,
      currency: "usd",
      paymentStatus: updated.paymentStatus,
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    capture_method: "manual",
    metadata: { deliveryId },
    automatic_payment_methods: { enabled: true },
  });

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      stripePaymentIntentId: intent.id,
      paymentStatus: "REQUIRES_PAYMENT",
      platformFee: platformFeeFromOffer(delivery.offerAmount),
    },
  });

  return {
    mode: "stripe",
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amount: updated.offerAmount,
    currency: "usd",
    paymentStatus: updated.paymentStatus,
  };
}

export async function markPaymentAuthorized(deliveryId: string) {
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: { paymentStatus: "AUTHORIZED" },
  });
}

/** Capture funds when delivery completes (or mock-capture). */
export async function capturePaymentForDelivery(deliveryId: string) {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery?.stripePaymentIntentId) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: "CAPTURED" },
    });
  }

  const stripe = getStripe();
  if (!stripe || delivery.stripePaymentIntentId.startsWith("pi_mock_")) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: "CAPTURED" },
    });
  }

  try {
    await stripe.paymentIntents.capture(delivery.stripePaymentIntentId);
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: "CAPTURED" },
    });
  } catch (err) {
    console.error("stripe capture failed", err);
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: "FAILED" },
    });
  }
}

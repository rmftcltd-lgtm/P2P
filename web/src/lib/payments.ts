import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const PLATFORM_FEE_RATE = 0.14; // ~14% platform take on Lonelyseat fare

export function platformFeeFromOffer(offerAmount: number) {
  return Math.round(offerAmount * PLATFORM_FEE_RATE * 100) / 100;
}

/** What the driver receives after platform fee, cover, and donations. */
export function driverPayoutFromDelivery(d: {
  offerAmount: number;
  platformFee: number;
  lonelyCoverFee: number;
  donationAmount: number;
}) {
  return (
    Math.round(
      (d.offerAmount - d.platformFee - d.lonelyCoverFee - d.donationAmount) * 100,
    ) / 100
  );
}

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function appBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export type PaymentIntentResult = {
  mode: "stripe" | "mock";
  clientSecret: string | null;
  paymentIntentId: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  publishableKey: string | null;
};

/** Authorize payment for a delivery (customer pays offerAmount). */
export async function createPaymentIntentForDelivery(
  deliveryId: string,
): Promise<PaymentIntentResult> {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      customer: true,
      driver: { include: { driver: true } },
    },
  });
  if (!delivery) throw new Error("Delivery not found");

  const amountCents = Math.round(delivery.offerAmount * 100);
  const platformFee = platformFeeFromOffer(delivery.offerAmount);
  const stripe = getStripe();

  // Zero / sub-minimum amounts use mock authorize (demo & free test journeys).
  // Stripe NZD PaymentIntents require a positive amount above provider minimums.
  if (!stripe || amountCents <= 0) {
    const mockId = `pi_mock_${deliveryId}`;
    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        stripePaymentIntentId: mockId,
        paymentStatus: "AUTHORIZED",
        platformFee: amountCents <= 0 ? 0 : platformFee,
        offerAmount: amountCents <= 0 ? 0 : delivery.offerAmount,
      },
    });
    return {
      mode: "mock",
      clientSecret: null,
      paymentIntentId: mockId,
      amount: updated.offerAmount,
      currency: "nzd",
      paymentStatus: updated.paymentStatus,
      publishableKey: null,
    };
  }

  // Reuse open intent if present
  if (
    delivery.stripePaymentIntentId &&
    !delivery.stripePaymentIntentId.startsWith("pi_mock_") &&
    delivery.paymentStatus === "REQUIRES_PAYMENT"
  ) {
    const existing = await stripe.paymentIntents.retrieve(delivery.stripePaymentIntentId);
    if (existing.client_secret && existing.status !== "canceled") {
      return {
        mode: "stripe",
        clientSecret: existing.client_secret,
        paymentIntentId: existing.id,
        amount: delivery.offerAmount,
        currency: "nzd",
        paymentStatus: delivery.paymentStatus,
        publishableKey: stripePublishableKey(),
      };
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "nzd",
    capture_method: "manual",
    receipt_email: delivery.customer.email,
    metadata: {
      deliveryId,
      requestCode: delivery.requestCode,
      customerId: delivery.customerId,
      driverId: delivery.driverId ?? "",
    },
    automatic_payment_methods: { enabled: true },
  });

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      stripePaymentIntentId: intent.id,
      paymentStatus: "REQUIRES_PAYMENT",
      platformFee,
    },
  });

  return {
    mode: "stripe",
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amount: updated.offerAmount,
    currency: "nzd",
    paymentStatus: updated.paymentStatus,
    publishableKey: stripePublishableKey(),
  };
}

export async function markPaymentAuthorized(deliveryId: string) {
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: { paymentStatus: "AUTHORIZED" },
  });
}

/** Capture funds when delivery completes, then Transfer to driver Connect account. */
export async function capturePaymentForDelivery(deliveryId: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { driver: { include: { driver: true } } },
  });
  if (!delivery) throw new Error("Delivery not found");

  const stripe = getStripe();
  const payout = driverPayoutFromDelivery(delivery);

  if (!delivery.stripePaymentIntentId) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: "CAPTURED", payoutStatus: "PAID" },
    });
  }

  // Mock path
  if (!stripe || delivery.stripePaymentIntentId.startsWith("pi_mock_")) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        paymentStatus: "CAPTURED",
        payoutStatus: "PAID",
        stripeTransferId: `tr_mock_${deliveryId}`,
      },
    });
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(delivery.stripePaymentIntentId);
    if (pi.status === "requires_capture") {
      await stripe.paymentIntents.capture(delivery.stripePaymentIntentId);
    }

    let transferId: string | null = delivery.stripeTransferId;
    const connectId = delivery.driver?.driver?.stripeAccountId;

    if (connectId && payout > 0 && !transferId) {
      const transfer = await stripe.transfers.create({
        amount: Math.round(payout * 100),
        currency: "nzd",
        destination: connectId,
        transfer_group: delivery.id,
        metadata: {
          deliveryId: delivery.id,
          requestCode: delivery.requestCode,
        },
      });
      transferId = transfer.id;
    }

    return prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        paymentStatus: "CAPTURED",
        payoutStatus: connectId ? (transferId ? "PAID" : "FAILED") : "PENDING",
        stripeTransferId: transferId,
      },
    });
  } catch (err) {
    console.error("stripe capture/transfer failed", err);
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: "FAILED", payoutStatus: "FAILED" },
    });
  }
}

/** Cancel authorized PaymentIntent or refund captured amount (mutual cancel). */
export async function reversePaymentForDelivery(
  deliveryId: string,
  opts: { refund: boolean },
) {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) return null;

  if (!delivery.stripePaymentIntentId) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: opts.refund ? "REFUNDED" : delivery.paymentStatus },
    });
  }

  const stripe = getStripe();
  if (!stripe || delivery.stripePaymentIntentId.startsWith("pi_mock_")) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: opts.refund ? "REFUNDED" : "FAILED" },
    });
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(delivery.stripePaymentIntentId);
    if (pi.status === "requires_capture" || pi.status === "requires_payment_method") {
      await stripe.paymentIntents.cancel(delivery.stripePaymentIntentId);
      return prisma.delivery.update({
        where: { id: deliveryId },
        data: { paymentStatus: "REFUNDED" },
      });
    }
    if (opts.refund && pi.status === "succeeded") {
      await stripe.refunds.create({ payment_intent: delivery.stripePaymentIntentId });
      return prisma.delivery.update({
        where: { id: deliveryId },
        data: { paymentStatus: "REFUNDED" },
      });
    }
  } catch (err) {
    console.error("stripe reverse failed", err);
  }

  return prisma.delivery.update({
    where: { id: deliveryId },
    data: { paymentStatus: opts.refund ? "REFUNDED" : delivery.paymentStatus },
  });
}

/** Create or resume Stripe Connect Express onboarding for a driver. */
export async function createDriverConnectOnboarding(userId: string) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { driver: true },
  });
  if (!user?.driver) throw new Error("Driver profile missing");

  if (!stripe) {
    // Mock: mark a fake Connect account so payouts work in demo
    await prisma.driverProfile.update({
      where: { userId },
      data: { stripeAccountId: `acct_mock_${userId.slice(-8)}` },
    });
    return {
      mode: "mock" as const,
      url: null as string | null,
      accountId: `acct_mock_${userId.slice(-8)}`,
      message: "Mock payouts enabled (set STRIPE_SECRET_KEY for live Connect).",
    };
  }

  let accountId = user.driver.stripeAccountId;
  if (!accountId || accountId.startsWith("acct_mock_")) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "NZ",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { userId: user.id },
    });
    accountId = account.id;
    await prisma.driverProfile.update({
      where: { userId },
      data: { stripeAccountId: accountId },
    });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appBaseUrl()}/driver?stripe=refresh`,
    return_url: `${appBaseUrl()}/driver?stripe=return`,
    type: "account_onboarding",
  });

  return {
    mode: "stripe" as const,
    url: link.url,
    accountId,
    message: "Complete Stripe onboarding to receive payouts.",
  };
}

export async function getDriverConnectStatus(userId: string) {
  const profile = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!profile?.stripeAccountId) {
    return { connected: false, chargesEnabled: false, payoutsEnabled: false, accountId: null };
  }
  if (profile.stripeAccountId.startsWith("acct_mock_")) {
    return {
      connected: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      accountId: profile.stripeAccountId,
      mode: "mock",
    };
  }
  const stripe = getStripe();
  if (!stripe) {
    return { connected: false, chargesEnabled: false, payoutsEnabled: false, accountId: null };
  }
  const account = await stripe.accounts.retrieve(profile.stripeAccountId);
  return {
    connected: true,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    accountId: profile.stripeAccountId,
    mode: "stripe",
  };
}

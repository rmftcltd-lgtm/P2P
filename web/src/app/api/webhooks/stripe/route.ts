import { getStripe, markPaymentAuthorized } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    return jsonError("Stripe not configured", 503);
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) return jsonError("Missing stripe-signature", 400);
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Dev/test without webhook signing
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("webhook verify failed", err);
    return jsonError("Invalid webhook", 400);
  }

  try {
    switch (event.type) {
      case "payment_intent.amount_capturable_updated":
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const deliveryId = pi.metadata?.deliveryId;
        if (deliveryId) {
          if (pi.status === "requires_capture" || pi.status === "succeeded") {
            await markPaymentAuthorized(deliveryId);
          }
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const deliveryId = pi.metadata?.deliveryId;
        if (deliveryId) {
          await prisma.delivery.update({
            where: { id: deliveryId },
            data: { paymentStatus: "FAILED" },
          });
        }
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        // Keep stripeAccountId already stored; status is fetched live when needed
        console.info("[stripe] account.updated", account.id, account.payouts_enabled);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("webhook handler error", err);
    return jsonError("Webhook handler failed", 500);
  }

  return jsonOk({ received: true });
}

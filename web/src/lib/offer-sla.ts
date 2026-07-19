import { prisma } from "@/lib/prisma";
import { notifyOfferUnsuccessful } from "@/lib/notify-events";

/** Wireframe: driver has 30 minutes to confirm a pending offer. */
export const OFFER_SLA_MS = 30 * 60 * 1000;

export function offerDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + OFFER_SLA_MS);
}

export function isOfferExpired(createdAt: Date, now = new Date()) {
  return now.getTime() - createdAt.getTime() >= OFFER_SLA_MS;
}

/**
 * Auto-reject pending offers past the 30-minute SLA.
 * Listing stays open (delivery remains PENDING) so others can book.
 */
export async function expireStaleOffers(now = new Date()) {
  const cutoff = new Date(now.getTime() - OFFER_SLA_MS);
  const stale = await prisma.deliveryOffer.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    include: {
      fromUser: { select: { id: true, name: true, email: true, phone: true, role: true } },
      delivery: { select: { id: true, requestCode: true, status: true } },
    },
    take: 100,
  });

  let expired = 0;
  for (const offer of stale) {
    await prisma.deliveryOffer.update({
      where: { id: offer.id },
      data: { status: "REJECTED" },
    });
    await prisma.deliveryEvent.create({
      data: {
        deliveryId: offer.deliveryId,
        status: offer.delivery.status,
        note: "Offer expired — no response within 30 minutes",
      },
    });
    void notifyOfferUnsuccessful({
      to: offer.fromUser,
      role: offer.fromUser.role === "DRIVER" ? "DRIVER" : "SENDER",
      requestCode: offer.delivery.requestCode,
    });
    expired += 1;
  }
  return { expired };
}

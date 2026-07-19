import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { formatRequestCode } from "@/lib/request-code";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * Invoices unlock after drop-off photo (wireframe booking details).
 * Returns Lonelyseat platform invoice + Driver invoice breakdown.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, email: true } },
        driver: { select: { name: true, email: true } },
      },
    });
    if (!delivery) return jsonError("Delivery not found", 404);
    if (
      delivery.customerId !== session.id &&
      delivery.driverId !== session.id
    ) {
      return jsonError("Forbidden", 403);
    }

    if (delivery.status !== "DELIVERED" || !delivery.dropoffPhotoUrl) {
      return jsonError(
        "Invoices unlock after the driver uploads a drop-off photo",
        409,
      );
    }

    const driverPayout =
      Math.round(
        (delivery.offerAmount -
          delivery.platformFee -
          delivery.lonelyCoverFee -
          delivery.donationAmount) *
          100,
      ) / 100;

    return jsonOk({
      requestCode: formatRequestCode(delivery.requestCode),
      unlocked: true,
      lonelyseatInvoice: {
        title: "Lonelyseat Invoice",
        to: delivery.customer.name,
        amount: delivery.offerAmount,
        fees: delivery.platformFee,
        lonelyCover: delivery.lonelyCoverFee,
        donations: delivery.donationAmount,
        currency: "NZD",
        item: delivery.itemTitle ?? "Delivery",
        route: `${delivery.pickupAddress} → ${delivery.dropoffAddress}`,
        deliveredAt: delivery.deliveredAt,
      },
      driverInvoice: {
        title: "Driver Invoice",
        to: delivery.driver?.name ?? "Driver",
        payout: driverPayout,
        currency: "NZD",
        item: delivery.itemTitle ?? "Delivery",
        requestCode: formatRequestCode(delivery.requestCode),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

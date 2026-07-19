import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const status = searchParams.get("status");

    const orders = await prisma.delivery.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(q
          ? {
              OR: [
                { requestCode: { contains: q } },
                { itemTitle: { contains: q } },
                { pickupAddress: { contains: q } },
                { dropoffAddress: { contains: q } },
                { customer: { name: { contains: q } } },
                { driver: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        driver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return jsonOk({
      orders: orders.map((o) => {
        const driverEarning = Math.max(
          0,
          o.offerAmount - o.platformFee - o.lonelyCoverFee - o.donationAmount,
        );
        return {
          id: o.id,
          requestCode: o.requestCode,
          date: o.createdAt,
          senderName: o.customer.name,
          driverName: o.driver?.name ?? "—",
          from: o.pickupAddress,
          to: o.dropoffAddress,
          spaceNeeded: o.spaceNeeded,
          itemTitle: o.itemTitle,
          price: o.offerAmount,
          totalCharge: o.offerAmount + o.lonelyCoverFee + o.donationAmount,
          lonelyseatFee: o.platformFee,
          charity: o.donationAmount,
          driverEarning,
          status: o.status,
          paymentStatus: o.paymentStatus,
        };
      }),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

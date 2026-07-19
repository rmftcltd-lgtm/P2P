import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ratingSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const { id } = await params;
    const body = ratingSchema.parse(await req.json());

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { rating: true, driver: { include: { driver: true } } },
    });
    if (!delivery) return jsonError("Delivery not found", 404);
    if (delivery.customerId !== session.id) return jsonError("Forbidden", 403);
    if (delivery.status !== "DELIVERED") {
      return jsonError("Rate only after delivery completes", 400);
    }
    if (!delivery.driverId) return jsonError("No driver to rate", 400);
    if (delivery.rating) return jsonError("Already rated", 409);

    const rating = await prisma.$transaction(async (tx) => {
      const created = await tx.rating.create({
        data: {
          deliveryId: id,
          fromUserId: session.id,
          toUserId: delivery.driverId!,
          stars: body.stars,
          comment: body.comment,
        },
      });

      const agg = await tx.rating.aggregate({
        where: { toUserId: delivery.driverId! },
        _avg: { stars: true },
        _count: true,
      });

      await tx.driverProfile.update({
        where: { userId: delivery.driverId! },
        data: {
          rating: Math.round((agg._avg.stars ?? body.stars) * 10) / 10,
        },
      });

      return created;
    });

    return jsonOk({ rating }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

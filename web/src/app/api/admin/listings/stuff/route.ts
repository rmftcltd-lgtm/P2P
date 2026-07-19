import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const stuff = await prisma.delivery.findMany({
      where: {
        status: "PENDING",
        ...(q
          ? {
              OR: [
                { itemTitle: { contains: q } },
                { pickupAddress: { contains: q } },
                { dropoffAddress: { contains: q } },
                { customer: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { customer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return jsonOk({
      listings: stuff.map((d) => ({
        id: d.id,
        requestCode: d.requestCode,
        itemTitle: d.itemTitle,
        spaceNeeded: d.spaceNeeded,
        price: d.offerAmount,
        from: d.pickupAddress,
        to: d.dropoffAddress,
        createdAt: d.createdAt,
        senderName: d.customer.name,
        status: d.status,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("Missing id", 400);
    await prisma.delivery.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

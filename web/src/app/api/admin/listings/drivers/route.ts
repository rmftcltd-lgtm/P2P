import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const trips = await prisma.driverTrip.findMany({
      where: q
        ? {
            OR: [
              { fromAddress: { contains: q } },
              { toAddress: { contains: q } },
              { vehicleType: { contains: q } },
              { driver: { name: { contains: q } } },
            ],
          }
        : undefined,
      include: { driver: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return jsonOk({
      listings: trips.map((t) => ({
        id: t.id,
        vehicleType: t.vehicleType,
        spaces: t.spaces,
        price: t.listedPrice,
        from: t.fromAddress,
        to: t.toAddress,
        departAt: t.departAt,
        createdAt: t.createdAt,
        status: t.status,
        tripType: t.tripType,
        driverName: t.driver.name,
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
    await prisma.driverTrip.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

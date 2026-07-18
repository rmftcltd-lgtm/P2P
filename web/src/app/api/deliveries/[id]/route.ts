import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!delivery) return jsonError("Delivery not found", 404);

    const isParty =
      delivery.customerId === session.id || delivery.driverId === session.id;
    if (!isParty && session.role === "CUSTOMER") {
      return jsonError("Forbidden", 403);
    }
    // Drivers can view pending jobs they might accept
    if (
      !isParty &&
      session.role === "DRIVER" &&
      delivery.status !== "PENDING"
    ) {
      return jsonError("Forbidden", 403);
    }

    return jsonOk({ delivery });
  } catch (err) {
    return handleApiError(err);
  }
}

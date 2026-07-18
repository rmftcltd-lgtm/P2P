import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { messageSchema } from "@/lib/validators";
import { publishDeliveryUpdated } from "@/lib/events";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

async function assertParty(deliveryId: string, userId: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { offers: { where: { status: "PENDING" } } },
  });
  if (!delivery) return null;
  const involved =
    delivery.customerId === userId ||
    delivery.driverId === userId ||
    delivery.offers.some((o) => o.driverId === userId || o.toUserId === userId);
  return involved ? delivery : null;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const delivery = await assertParty(id, session.id);
    if (!delivery) return jsonError("Forbidden", 403);

    const [messages, events] = await Promise.all([
      prisma.message.findMany({
        where: { deliveryId: id },
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.deliveryEvent.findMany({
        where: { deliveryId: id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Unified feed like the wireframe inbox thread
    const feed = [
      ...events.map((e) => ({
        kind: "system" as const,
        id: e.id,
        createdAt: e.createdAt,
        body: e.note ?? e.status,
        status: e.status,
        photoUrl: null as string | null,
      })),
      ...messages.map((m) => ({
        kind: "message" as const,
        id: m.id,
        createdAt: m.createdAt,
        body: m.body,
        status: null as string | null,
        photoUrl: m.photoUrl,
        sender: m.sender,
      })),
    ].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return jsonOk({
      delivery: {
        id: delivery.id,
        requestCode: delivery.requestCode,
        status: delivery.status,
        itemTitle: delivery.itemTitle,
        customerId: delivery.customerId,
        driverId: delivery.driverId,
        pickupPhotoUrl: delivery.pickupPhotoUrl,
        dropoffPhotoUrl: delivery.dropoffPhotoUrl,
        cancellationStatus: delivery.cancellationStatus,
      },
      feed,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = messageSchema.parse(await req.json());
    const delivery = await assertParty(id, session.id);
    if (!delivery) return jsonError("Forbidden", 403);

    const message = await prisma.message.create({
      data: {
        deliveryId: id,
        senderId: session.id,
        body: body.body,
        photoUrl: body.photoUrl || null,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: id,
      status: delivery.status,
      customerId: delivery.customerId,
      driverId: delivery.driverId,
    });

    return jsonOk({ message }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

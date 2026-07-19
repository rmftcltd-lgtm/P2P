import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { publishDeliveryUpdated } from "@/lib/events";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireCompleteRegistration } from "@/lib/profile-gate";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const gate = await requireCompleteRegistration();
    if (gate.incomplete) return gate.response!;
    if (gate.session.role !== "DRIVER") {
      return jsonError("Driver account required", 403);
    }
    const session = gate.session;
    const { id } = await params;

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: session.id },
    });
    if (!driver) return jsonError("Driver profile missing", 400);
    if (!driver.isOnline) {
      return jsonError("Go online before accepting jobs", 400);
    }
    if (driver.kycStatus === "UNVERIFIED" || driver.kycStatus === "REJECTED") {
      return jsonError("Complete driver verification (KYC) before accepting jobs", 403);
    }

    const result = await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({ where: { id } });
      if (!delivery) return { error: "Delivery not found", status: 404 as const };
      if (delivery.status !== "PENDING") {
        return { error: "Delivery is no longer available", status: 409 as const };
      }

      const active = await tx.delivery.count({
        where: {
          driverId: session.id,
          status: { in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT"] },
        },
      });
      if (active > 0) {
        return {
          error: "Finish your current delivery first",
          status: 409 as const,
        };
      }

      const updated = await tx.delivery.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          driverId: session.id,
          acceptedAt: new Date(),
          events: {
            create: {
              status: "ACCEPTED",
              note: `${session.name} accepted the job`,
              lat: driver.lat ?? undefined,
              lng: driver.lng ?? undefined,
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          driver: { select: { id: true, name: true, phone: true } },
          events: { orderBy: { createdAt: "asc" } },
        },
      });

      return { delivery: updated };
    });

    if ("error" in result && result.error) {
      return jsonError(result.error, result.status);
    }

    const delivery = result.delivery!;
    publishDeliveryUpdated({
      type: "delivery.updated",
      deliveryId: delivery.id,
      status: delivery.status,
      customerId: delivery.customerId,
      driverId: delivery.driverId,
    });

    return jsonOk({ delivery });
  } catch (err) {
    return handleApiError(err);
  }
}

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createTripSchema } from "@/lib/validators";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";
import { publish } from "@/lib/events";
import { requireCompleteRegistration } from "@/lib/profile-gate";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.role === "DRIVER") {
      const trips = await prisma.driverTrip.findMany({
        where: { driverId: session.id },
        orderBy: { departAt: "asc" },
        include: {
          driver: { select: { id: true, name: true } },
          _count: { select: { deliveries: true } },
        },
      });
      return jsonOk({ trips });
    }

    // Senders browse open lonely-seat journeys
    const trips = await prisma.driverTrip.findMany({
      where: { status: "OPEN", departAt: { gte: new Date(Date.now() - 86400000) } },
      orderBy: { departAt: "asc" },
      take: 40,
      include: {
        driver: { select: { id: true, name: true } },
      },
    });
    return jsonOk({ trips });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requireCompleteRegistration();
    if (gate.incomplete) return gate.response!;
    if (gate.session.role !== "DRIVER") {
      return jsonError("Driver account required", 403);
    }
    const session = gate.session;
    const body = createTripSchema.parse(await req.json());

    if (body.tripType === "DAY_TRIP" && !body.returnAt) {
      // default return = depart + 8h if not provided
      body.returnAt = new Date(
        new Date(body.departAt).getTime() + 8 * 60 * 60 * 1000,
      ).toISOString();
    }

    const batchId =
      body.tripType === "MULTI" || (body.extraLegs && body.extraLegs.length > 0)
        ? randomUUID()
        : null;

    const primary = await prisma.driverTrip.create({
      data: {
        driverId: session.id,
        tripType: body.tripType,
        batchId,
        fromAddress: body.fromAddress,
        fromLat: body.fromLat,
        fromLng: body.fromLng,
        toAddress: body.toAddress,
        toLat: body.toLat,
        toLng: body.toLng,
        departAt: new Date(body.departAt),
        returnAt: body.returnAt ? new Date(body.returnAt) : null,
        spaces: JSON.stringify(body.spaces),
        vehicleType: body.vehicleType,
        notes: body.notes,
        listedPrice: body.listedPrice,
      },
    });

    const extras = [];
    if (body.tripType === "DAY_TRIP" && body.returnAt) {
      // Create return leg as companion listing
      extras.push(
        await prisma.driverTrip.create({
          data: {
            driverId: session.id,
            tripType: "DAY_TRIP",
            batchId: batchId ?? randomUUID(),
            fromAddress: body.toAddress,
            fromLat: body.toLat,
            fromLng: body.toLng,
            toAddress: body.fromAddress,
            toLat: body.fromLat,
            toLng: body.fromLng,
            departAt: new Date(body.returnAt),
            spaces: JSON.stringify(body.spaces),
            vehicleType: body.vehicleType,
            notes: body.notes ? `Return: ${body.notes}` : "Day-trip return leg",
            listedPrice: body.listedPrice,
          },
        }),
      );
      if (!batchId) {
        await prisma.driverTrip.update({
          where: { id: primary.id },
          data: { batchId: extras[0].batchId },
        });
      }
    }

    for (const leg of body.extraLegs ?? []) {
      extras.push(
        await prisma.driverTrip.create({
          data: {
            driverId: session.id,
            tripType: "MULTI",
            batchId: batchId ?? randomUUID(),
            fromAddress: leg.fromAddress,
            fromLat: leg.fromLat,
            fromLng: leg.fromLng,
            toAddress: leg.toAddress,
            toLat: leg.toLat,
            toLng: leg.toLng,
            departAt: new Date(leg.departAt),
            spaces: JSON.stringify(body.spaces),
            vehicleType: body.vehicleType,
            notes: body.notes,
          },
        }),
      );
    }

    publish("jobs:refresh", { type: "jobs.refresh", reason: "trip.created" });

    return jsonOk(
      { trip: primary, related: extras, message: "Lonely seat listing published" },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}

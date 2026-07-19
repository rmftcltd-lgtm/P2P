import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { locationSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const session = await requireSession(["DRIVER"]);
    const body = locationSchema.parse(await req.json());

    const driver = await prisma.driverProfile.update({
      where: { userId: session.id },
      data: {
        lat: body.lat,
        lng: body.lng,
        ...(body.isOnline !== undefined ? { isOnline: body.isOnline } : {}),
        lastSeenAt: new Date(),
      },
    });

    return jsonOk({ driver });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession(["DRIVER"]);
    const body = await req.json();
    const isOnline = Boolean(body.isOnline);

    const existing = await prisma.driverProfile.findUnique({
      where: { userId: session.id },
    });
    if (!existing) return jsonError("Driver profile missing", 400);

    if (isOnline && (existing.lat == null || existing.lng == null)) {
      return jsonError("Set your location before going online", 400);
    }

    const driver = await prisma.driverProfile.update({
      where: { userId: session.id },
      data: { isOnline, lastSeenAt: new Date() },
    });

    return jsonOk({ driver });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { kycSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession(["DRIVER"]);
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: session.id },
    });
    if (!driver) return jsonError("Driver profile missing", 400);
    return jsonOk({
      kyc: {
        status: driver.kycStatus,
        submittedAt: driver.kycSubmittedAt,
        licenseNumber: driver.licenseNumber,
        idDocumentNote: driver.idDocumentNote,
        vehicleType: driver.vehicleType,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession(["DRIVER"]);
    const body = kycSchema.parse(await req.json());

    // Demo auto-approval. Swap for Stripe Identity / manual review in production.
    const driver = await prisma.driverProfile.update({
      where: { userId: session.id },
      data: {
        licenseNumber: body.licenseNumber,
        idDocumentNote: body.idDocumentNote,
        vehicleType: body.vehicleType ?? undefined,
        kycStatus: "APPROVED",
        kycSubmittedAt: new Date(),
      },
    });

    return jsonOk({
      kyc: {
        status: driver.kycStatus,
        submittedAt: driver.kycSubmittedAt,
        licenseNumber: driver.licenseNumber,
        idDocumentNote: driver.idDocumentNote,
        vehicleType: driver.vehicleType,
      },
      message: "Verification approved (demo auto-approve).",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

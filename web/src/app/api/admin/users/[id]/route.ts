import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(30).nullable().optional(),
  isActive: z.boolean().optional(),
  registrationComplete: z.boolean().optional(),
  registrationType: z.enum(["INDIVIDUAL", "ORGANISATION"]).nullable().optional(),
  organisationName: z.string().max(120).nullable().optional(),
  nzbn: z.string().max(40).nullable().optional(),
  dateOfBirth: z.string().max(20).nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  aboutMe: z.string().max(2000).nullable().optional(),
  physicalAddress: z.string().max(300).nullable().optional(),
  postalAddress: z.string().max(300).nullable().optional(),
  idVerified: z.boolean().optional(),
  licenceVerified: z.boolean().optional(),
  hasNzLicence: z.boolean().nullable().optional(),
  kycStatus: z.enum(["UNVERIFIED", "PENDING", "APPROVED", "REJECTED"]).optional(),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { driver: true },
    });
    if (!user || user.role === "ADMIN") return jsonError("Not found", 404);
    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { driver: true },
    });
    if (!existing || existing.role === "ADMIN") return jsonError("Not found", 404);

    const { kycStatus, ...userFields } = body;
    const user = await prisma.user.update({
      where: { id },
      data: userFields,
      include: { driver: true },
    });

    if (kycStatus && existing.driver) {
      await prisma.driverProfile.update({
        where: { userId: id },
        data: {
          kycStatus,
          ...(kycStatus === "APPROVED" ? { kycSubmittedAt: new Date() } : {}),
        },
      });
    }

    const refreshed = await prisma.user.findUnique({
      where: { id },
      include: { driver: true },
    });
    return jsonOk({ user: refreshed ?? user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role === "ADMIN") return jsonError("Not found", 404);
    await prisma.user.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

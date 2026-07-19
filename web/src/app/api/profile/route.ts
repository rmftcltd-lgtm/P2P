import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { profileCompleteSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

/** Complete onboarding profile (wireframe mandatory profile gate). */
export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = profileCompleteSchema.parse(await req.json());

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        name: body.name,
        phone: body.phone,
        physicalAddress: body.physicalAddress,
        dateOfBirth: body.dateOfBirth || null,
        gender: body.gender || null,
        aboutMe: body.aboutMe || null,
        registrationType: body.registrationType || "INDIVIDUAL",
        organisationName: body.organisationName || null,
        nzbn: body.nzbn || null,
        registrationComplete: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        registrationComplete: true,
        physicalAddress: true,
        dateOfBirth: true,
        gender: true,
        aboutMe: true,
      },
    });

    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        registrationComplete: true,
        physicalAddress: true,
        dateOfBirth: true,
        gender: true,
        aboutMe: true,
        registrationType: true,
        organisationName: true,
        nzbn: true,
      },
    });
    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

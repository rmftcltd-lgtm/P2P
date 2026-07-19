import { prisma } from "@/lib/prisma";
import { createSessionToken, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

/** Mobile-friendly login that returns a Bearer token. */
export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user) return jsonError("Invalid email or password", 401);

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return jsonError("Invalid email or password", 401);

    const token = await createSessionToken(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      "30d",
    );

    return jsonOk({
      token,
      tokenType: "Bearer",
      expiresIn: 60 * 60 * 24 * 30,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

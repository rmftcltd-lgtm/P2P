import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user) return jsonError("Invalid email or password", 401);

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return jsonError("Invalid email or password", 401);
    if (!user.isActive) {
      return jsonError("This account has been deactivated. Contact support.", 403);
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    return jsonOk({
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

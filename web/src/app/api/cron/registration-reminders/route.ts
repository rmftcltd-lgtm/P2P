import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { notifyRegistrationReminder } from "@/lib/notify-events";

/**
 * Incomplete-registration nudges (2 days + 10 days).
 * Secure with CRON_SECRET: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = req.headers.get("authorization");
      if (auth !== `Bearer ${secret}`) {
        return jsonError("Unauthorized", 401);
      }
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const users = await prisma.user.findMany({
      where: {
        registrationComplete: false,
        role: { not: "ADMIN" },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
      take: 200,
    });

    let sent2 = 0;
    let sent10 = 0;
    for (const u of users) {
      const age = now - u.createdAt.getTime();
      if (age >= 2 * day && age < 3 * day) {
        void notifyRegistrationReminder(u, "2d");
        sent2 += 1;
      } else if (age >= 10 * day && age < 11 * day) {
        void notifyRegistrationReminder(u, "10d");
        sent10 += 1;
      }
    }

    return jsonOk({ checked: users.length, sent2, sent10 });
  } catch (err) {
    return handleApiError(err);
  }
}

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

    let sent7 = 0;
    let sent30 = 0;
    for (const u of users) {
      const age = now - u.createdAt.getTime();
      // Wireframe: automated email after 7 days and 1 month
      if (age >= 7 * day && age < 8 * day) {
        void notifyRegistrationReminder(u, "7d");
        sent7 += 1;
      } else if (age >= 30 * day && age < 31 * day) {
        void notifyRegistrationReminder(u, "30d");
        sent30 += 1;
      }
    }

    return jsonOk({ checked: users.length, sent7, sent30 });
  } catch (err) {
    return handleApiError(err);
  }
}

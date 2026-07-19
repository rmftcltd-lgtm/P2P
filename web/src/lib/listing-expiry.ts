import { prisma } from "@/lib/prisma";
import { notifyListingExpiring, notifyListingExpired } from "@/lib/notify-events";

/**
 * Wireframe listing expiry:
 * - Expire once the (last) pickup/depart datetime has passed.
 * - Email 1 day before expiry.
 */
export async function expireStaleListings(now = new Date()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inOneDayEnd = new Date(inOneDay.getTime() + 60 * 60 * 1000);

  let tripsExpired = 0;
  let stuffExpired = 0;
  let reminders = 0;

  // Driver journeys past departAt
  const pastTrips = await prisma.driverTrip.findMany({
    where: { status: "OPEN", departAt: { lt: now } },
    include: {
      driver: { select: { email: true, phone: true, name: true } },
    },
    take: 80,
  });
  for (const trip of pastTrips) {
    await prisma.driverTrip.update({
      where: { id: trip.id },
      data: { status: "COMPLETED" },
    });
    void notifyListingExpired({
      to: trip.driver,
      kind: "journey",
      summary: `${trip.fromAddress.split(",")[0]} → ${trip.toAddress.split(",")[0]}`,
    });
    tripsExpired += 1;
  }

  // Open stuff: preferredDate in the past (flexible/null stays live)
  const pastStuff = await prisma.delivery.findMany({
    where: {
      status: "PENDING",
      driverId: null,
      preferredDate: { lt: startOfToday },
    },
    include: {
      customer: { select: { email: true, phone: true, name: true } },
    },
    take: 80,
  });
  for (const d of pastStuff) {
    await prisma.delivery.update({
      where: { id: d.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancellationReason: "Listing expired — preferred pickup date passed",
        events: {
          create: {
            status: "CANCELLED",
            note: "Listing expired after preferred pickup date",
          },
        },
      },
    });
    void notifyListingExpired({
      to: d.customer,
      kind: "stuff",
      summary: `#${d.requestCode} ${d.itemTitle ?? "Item"}`,
    });
    stuffExpired += 1;
  }

  // T-1 reminders for journeys
  const soonTrips = await prisma.driverTrip.findMany({
    where: {
      status: "OPEN",
      departAt: { gte: inOneDay, lt: inOneDayEnd },
    },
    include: {
      driver: { select: { email: true, phone: true, name: true } },
    },
    take: 80,
  });
  for (const trip of soonTrips) {
    void notifyListingExpiring({
      to: trip.driver,
      kind: "journey",
      summary: `${trip.fromAddress.split(",")[0]} → ${trip.toAddress.split(",")[0]}`,
      when: trip.departAt,
    });
    reminders += 1;
  }

  const soonStuff = await prisma.delivery.findMany({
    where: {
      status: "PENDING",
      driverId: null,
      preferredDate: { gte: inOneDay, lt: inOneDayEnd },
    },
    include: {
      customer: { select: { email: true, phone: true, name: true } },
    },
    take: 80,
  });
  for (const d of soonStuff) {
    void notifyListingExpiring({
      to: d.customer,
      kind: "stuff",
      summary: `#${d.requestCode} ${d.itemTitle ?? "Item"}`,
      when: d.preferredDate!,
    });
    reminders += 1;
  }

  return { tripsExpired, stuffExpired, reminders };
}

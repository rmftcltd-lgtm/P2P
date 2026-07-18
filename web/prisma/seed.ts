import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import path from "node:path";
import { DEMO_PLACES, distanceKm, estimateFare } from "../src/lib/geo";
import { platformFeeFromOffer } from "../src/lib/payments";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const resolved =
  url.startsWith("file:") && !url.startsWith("file:/")
    ? `file:${path.resolve(process.cwd(), url.replace(/^file:/, ""))}`
    : url;

const adapter = new PrismaBetterSqlite3({ url: resolved });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.deliveryOffer.deleteMany();
  await prisma.deliveryEvent.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.driverTrip.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const sender = await prisma.user.create({
    data: {
      email: "sender@lonelyseat.test",
      name: "Casey Manarangi",
      phone: "+64-21-555-0101",
      role: "CUSTOMER",
      passwordHash,
    },
  });

  // Backward-compatible alias used in earlier demos
  await prisma.user.create({
    data: {
      email: "customer@relay.test",
      name: "Casey Manarangi",
      phone: "+64-21-555-0101",
      role: "CUSTOMER",
      passwordHash,
    },
  });

  const hamilton = DEMO_PLACES.find((p) => p.label === "Hamilton")!;
  const auckland = DEMO_PLACES.find((p) => p.label === "Auckland CBD")!;
  const christchurch = DEMO_PLACES.find((p) => p.label === "Christchurch")!;

  const driverUser = await prisma.user.create({
    data: {
      email: "driver@lonelyseat.test",
      name: "Devon Raukawa",
      phone: "+64-21-555-0202",
      role: "DRIVER",
      passwordHash,
      driver: {
        create: {
          isOnline: true,
          vehicleType: "car",
          lat: hamilton.lat,
          lng: hamilton.lng,
          rating: 4.9,
          completedCount: 42,
          kycStatus: "APPROVED",
          kycSubmittedAt: new Date(),
          licenseNumber: "NZ-DL-1234567",
          idDocumentNote: "Seeded verified Lonelyseat driver",
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "driver@relay.test",
      name: "Devon Raukawa",
      phone: "+64-21-555-0202",
      role: "DRIVER",
      passwordHash,
      driver: {
        create: {
          isOnline: true,
          vehicleType: "car",
          lat: hamilton.lat,
          lng: hamilton.lng,
          rating: 4.9,
          completedCount: 42,
          kycStatus: "APPROVED",
          kycSubmittedAt: new Date(),
          licenseNumber: "NZ-DL-7654321",
          idDocumentNote: "Alias seeded driver",
        },
      },
    },
  });

  // Local Waikato corridor job near Hamilton driver
  const localDistance = distanceKm(
    auckland.lat,
    auckland.lng,
    hamilton.lat,
    hamilton.lng,
  );
  const localFare = estimateFare(localDistance, "MEDIUM");
  await prisma.delivery.create({
    data: {
      requestCode: "5621",
      customerId: sender.id,
      status: "PENDING",
      pickupAddress: auckland.address,
      pickupLat: auckland.lat,
      pickupLng: auckland.lng,
      dropoffAddress: hamilton.address,
      dropoffLat: hamilton.lat,
      dropoffLng: hamilton.lng,
      packageSize: "MEDIUM",
      spaceNeeded: "backseat",
      itemTitle: "Kitchenware box",
      packageNotes: "Backseat space — box of kitchenware, leave with flatmate",
      lengthCm: 40,
      widthCm: 30,
      fullyPackaged: true,
      greetAtPickup: true,
      distanceKm: Math.round(localDistance * 100) / 100,
      offerAmount: localFare,
      platformFee: platformFeeFromOffer(localFare),
      paymentStatus: "REQUIRES_PAYMENT",
      events: {
        create: { status: "PENDING", note: "Seeded Auckland → Hamilton listing" },
      },
    },
  });

  // Classic Lonelyseat press example corridor (may be out of 50km radius for Hamilton driver)
  const longDistance = distanceKm(
    auckland.lat,
    auckland.lng,
    christchurch.lat,
    christchurch.lng,
  );
  const longFare = estimateFare(longDistance, "LARGE");
  await prisma.delivery.create({
    data: {
      requestCode: "5631",
      customerId: sender.id,
      status: "PENDING",
      pickupAddress: auckland.address,
      pickupLat: auckland.lat,
      pickupLng: auckland.lng,
      dropoffAddress: christchurch.address,
      dropoffLat: christchurch.lat,
      dropoffLng: christchurch.lng,
      packageSize: "LARGE",
      spaceNeeded: "boot_sedan",
      itemTitle: "Desk chair",
      packageNotes: "Desk chair — Lonelyseat guide vs ~$150 traditional courier",
      lengthCm: 90,
      widthCm: 60,
      distanceKm: Math.round(longDistance * 100) / 100,
      offerAmount: longFare,
      platformFee: platformFeeFromOffer(longFare),
      paymentStatus: "REQUIRES_PAYMENT",
      events: {
        create: {
          status: "PENDING",
          note: "Seeded Auckland → Christchurch chair listing",
        },
      },
    },
  });

  console.log("Seeded Lonelyseat demo users:");
  console.log("  sender@lonelyseat.test / password123");
  console.log("  driver@lonelyseat.test / password123");
  console.log("  (aliases customer@relay.test / driver@relay.test)");
  console.log(`  driver id: ${driverUser.id}`);
  console.log(`  AKL→HAM fare ~$${localFare} · AKL→CHC chair ~$${longFare}`);

  // Sample one-way lonely-seat journey (tutorial: Create Driver listing One-way)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.driverTrip.create({
    data: {
      driverId: driverUser.id,
      tripType: "ONE_WAY",
      fromAddress: auckland.address,
      fromLat: auckland.lat,
      fromLng: auckland.lng,
      toAddress: hamilton.address,
      toLat: hamilton.lat,
      toLng: hamilton.lng,
      departAt: tomorrow,
      spaces: JSON.stringify(["shoebox", "backseat", "boot_sedan"]),
      vehicleType: "car",
      listedPrice: Math.round(localFare),
      notes: "Seeded one-way lonely seat — Auckland to Hamilton",
      status: "OPEN",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

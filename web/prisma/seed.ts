import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import path from "node:path";
import { DEMO_PLACES, distanceKm, estimateFare } from "../src/lib/geo";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const resolved =
  url.startsWith("file:") && !url.startsWith("file:/")
    ? `file:${path.resolve(process.cwd(), url.replace(/^file:/, ""))}`
    : url;

const adapter = new PrismaBetterSqlite3({ url: resolved });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.deliveryEvent.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const customer = await prisma.user.create({
    data: {
      email: "customer@relay.test",
      name: "Casey Rivera",
      phone: "+1-415-555-0101",
      role: "CUSTOMER",
      passwordHash,
    },
  });

  const driver = await prisma.user.create({
    data: {
      email: "driver@relay.test",
      name: "Devon Park",
      phone: "+1-415-555-0202",
      role: "DRIVER",
      passwordHash,
      driver: {
        create: {
          isOnline: true,
          vehicleType: "bike",
          lat: 37.7749,
          lng: -122.4194,
          rating: 4.9,
          completedCount: 42,
        },
      },
    },
  });

  const pickup = DEMO_PLACES[0];
  const dropoff = DEMO_PLACES[1];
  const distance = distanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

  await prisma.delivery.create({
    data: {
      customerId: customer.id,
      status: "PENDING",
      pickupAddress: pickup.address,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffAddress: dropoff.address,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      packageSize: "SMALL",
      packageNotes: "Envelope — leave with front desk",
      distanceKm: Math.round(distance * 100) / 100,
      offerAmount: estimateFare(distance, "SMALL"),
      events: {
        create: { status: "PENDING", note: "Seeded open job" },
      },
    },
  });

  console.log("Seeded Relay demo users:");
  console.log("  customer@relay.test / password123");
  console.log("  driver@relay.test   / password123");
  console.log(`  driver user id: ${driver.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

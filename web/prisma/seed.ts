import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import path from "node:path";

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

  await prisma.user.create({
    data: {
      email: "sender@lonelyseat.test",
      name: "Casey Manarangi",
      phone: "+64-21-555-0101",
      role: "CUSTOMER",
      passwordHash,
    },
  });

  // Backward-compatible alias
  await prisma.user.create({
    data: {
      email: "customer@relay.test",
      name: "Casey Manarangi",
      phone: "+64-21-555-0101",
      role: "CUSTOMER",
      passwordHash,
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      email: "driver@lonelyseat.test",
      name: "Devon Raukawa",
      phone: "+64-21-555-0202",
      role: "DRIVER",
      passwordHash,
      driver: {
        create: {
          isOnline: false,
          vehicleType: "car",
          lat: null,
          lng: null,
          rating: 0,
          completedCount: 0,
          kycStatus: "APPROVED",
          kycSubmittedAt: new Date(),
          licenseNumber: "NZ-DL-1234567",
          idDocumentNote: "Demo verified driver account",
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
          isOnline: false,
          vehicleType: "car",
          lat: null,
          lng: null,
          rating: 0,
          completedCount: 0,
          kycStatus: "APPROVED",
          kycSubmittedAt: new Date(),
          licenseNumber: "NZ-DL-7654321",
          idDocumentNote: "Alias demo driver account",
        },
      },
    },
  });

  console.log("Seeded Lonelyseat accounts (no sample listings):");
  console.log("  sender@lonelyseat.test / password123");
  console.log("  driver@lonelyseat.test / password123");
  console.log("  (aliases customer@relay.test / driver@relay.test)");
  console.log(`  driver id: ${driverUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

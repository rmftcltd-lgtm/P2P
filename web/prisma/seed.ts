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

const SPACE_LABELS = [
  { key: "shoebox", label: "Shoebox / parcel" },
  { key: "frontseat", label: "Front seat" },
  { key: "backseat", label: "Back seat" },
  { key: "boot_sedan", label: "Boot (sedan)" },
  { key: "boot_hatch", label: "Boot (hatch/wagon)" },
  { key: "boot_other", label: "Boot (other)" },
  { key: "trailer", label: "Trailer" },
];

const TIME_LABELS = [
  { key: "flexible", label: "Flexible" },
  { key: "morning", label: "Morning only (7am–midday)" },
  { key: "afternoon", label: "Afternoon only (midday–6pm)" },
  { key: "evening", label: "Evening only (after 6pm)" },
];

const RIDE_LABELS = [
  { key: "pd", label: "Motorised PD (e.g. scooter / bike)" },
  { key: "coupe", label: "2-door coupe / convertible" },
  { key: "hatch", label: "Hatchback (e.g. Kia Rio)" },
  { key: "sedan_small", label: "Small sedan (e.g. Nissan Tiida)" },
  { key: "sedan_large", label: "Large sedan" },
  { key: "wagon_small", label: "Small station wagon" },
  { key: "wagon_large", label: "Large station wagon" },
  { key: "people_mover", label: "Minivan / people mover" },
  { key: "suv", label: "SUV" },
  { key: "ute", label: "Ute" },
  { key: "van_small", label: "Small van" },
  { key: "van_large", label: "Large van (e.g. Ford Transit)" },
];

async function main() {
  await prisma.userFeedback.deleteMany();
  await prisma.contentPage.deleteMany();
  await prisma.labelOption.deleteMany();
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
      email: "admin@lonelyseat.test",
      name: "Lonelyseat Admin",
      phone: "+64-21-555-0000",
      role: "ADMIN",
      passwordHash,
      registrationComplete: true,
      idVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "sender@lonelyseat.test",
      name: "Casey Manarangi",
      phone: "+64-21-555-0101",
      role: "CUSTOMER",
      passwordHash,
      registrationComplete: true,
      registrationType: "INDIVIDUAL",
    },
  });

  await prisma.user.create({
    data: {
      email: "customer@relay.test",
      name: "Casey Manarangi",
      phone: "+64-21-555-0101",
      role: "CUSTOMER",
      passwordHash,
      registrationComplete: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "driver@lonelyseat.test",
      name: "Devon Raukawa",
      phone: "+64-21-555-0202",
      role: "DRIVER",
      passwordHash,
      registrationComplete: true,
      registrationType: "INDIVIDUAL",
      hasNzLicence: true,
      licenceVerified: true,
      idVerified: true,
      driver: {
        create: {
          isOnline: false,
          vehicleType: "ute",
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
      registrationComplete: true,
      driver: {
        create: {
          isOnline: false,
          vehicleType: "car",
          kycStatus: "APPROVED",
          kycSubmittedAt: new Date(),
          licenseNumber: "NZ-DL-7654321",
        },
      },
    },
  });

  // Incomplete registrations (wireframe)
  await prisma.user.create({
    data: {
      email: "unfinished@lonelyseat.test",
      name: "Unfinished Signup",
      passwordHash,
      role: "CUSTOMER",
      registrationComplete: false,
      isActive: false,
    },
  });

  for (const [i, row] of SPACE_LABELS.entries()) {
    await prisma.labelOption.create({
      data: { category: "SPACE", key: row.key, label: row.label, sortOrder: i },
    });
  }
  for (const [i, row] of TIME_LABELS.entries()) {
    await prisma.labelOption.create({
      data: { category: "TIME", key: row.key, label: row.label, sortOrder: i },
    });
  }
  for (const [i, row] of RIDE_LABELS.entries()) {
    await prisma.labelOption.create({
      data: { category: "RIDE", key: row.key, label: row.label, sortOrder: i },
    });
  }

  await prisma.contentPage.create({
    data: {
      title: "Help",
      slug: "help",
      position: "FOOTER",
      content:
        "<p>Kia ora — Lonelyseat matches stuff with Kiwis already heading that way across Aotearoa.</p>",
      metaDescription: "Lonelyseat help",
    },
  });
  await prisma.contentPage.create({
    data: {
      title: "Contact",
      slug: "contact",
      position: "FOOTER",
      content: "<p>Email <a href='mailto:hello@lonelyseat.test'>hello@lonelyseat.test</a>.</p>",
      metaDescription: "Contact Lonelyseat",
    },
  });

  await prisma.userFeedback.create({
    data: {
      name: "Alex",
      email: "alex@example.com",
      message: "Love the idea — more corridors on the South Island please!",
      status: "NEW",
    },
  });

  console.log("Seeded Lonelyseat accounts (no sample listings):");
  console.log("  admin@lonelyseat.test / password123");
  console.log("  sender@lonelyseat.test / password123");
  console.log("  driver@lonelyseat.test / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

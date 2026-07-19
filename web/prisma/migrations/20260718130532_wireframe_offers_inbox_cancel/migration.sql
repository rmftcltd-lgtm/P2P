/*
  Warnings:

  - Added the required column `requestCode` to the `Delivery` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DriverTrip" ADD COLUMN "listedPrice" REAL;

-- CreateTable
CREATE TABLE "DeliveryOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "initiator" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryOffer_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryOffer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeliveryOffer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "driverId" TEXT,
    "tripId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" REAL NOT NULL,
    "pickupLng" REAL NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLat" REAL NOT NULL,
    "dropoffLng" REAL NOT NULL,
    "preferredDate" DATETIME,
    "preferredDropoffDate" DATETIME,
    "packageSize" TEXT NOT NULL DEFAULT 'SMALL',
    "spaceNeeded" TEXT NOT NULL DEFAULT 'shoebox',
    "itemTitle" TEXT,
    "packageNotes" TEXT,
    "lengthCm" REAL,
    "widthCm" REAL,
    "fullyPackaged" BOOLEAN NOT NULL DEFAULT false,
    "greetAtPickup" BOOLEAN NOT NULL DEFAULT false,
    "greetAtDropoff" BOOLEAN NOT NULL DEFAULT false,
    "offerAmount" REAL NOT NULL,
    "distanceKm" REAL NOT NULL,
    "platformFee" REAL NOT NULL DEFAULT 0,
    "lonelyCover" BOOLEAN NOT NULL DEFAULT false,
    "lonelyCoverFee" REAL NOT NULL DEFAULT 0,
    "donateBrake" BOOLEAN NOT NULL DEFAULT false,
    "donateTrees" BOOLEAN NOT NULL DEFAULT false,
    "donationAmount" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "stripePaymentIntentId" TEXT,
    "pickupPhotoUrl" TEXT,
    "dropoffPhotoUrl" TEXT,
    "cancellationMode" TEXT,
    "cancellationStatus" TEXT NOT NULL DEFAULT 'NONE',
    "cancellationReason" TEXT,
    "cancellationById" TEXT,
    "acceptedAt" DATETIME,
    "pickedUpAt" DATETIME,
    "deliveredAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "DriverTrip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Delivery" ("acceptedAt", "cancelledAt", "createdAt", "customerId", "deliveredAt", "distanceKm", "driverId", "dropoffAddress", "dropoffLat", "dropoffLng", "dropoffPhotoUrl", "id", "lonelyCover", "lonelyCoverFee", "offerAmount", "packageNotes", "packageSize", "paymentStatus", "pickedUpAt", "pickupAddress", "pickupLat", "pickupLng", "platformFee", "preferredDate", "requestCode", "spaceNeeded", "status", "stripePaymentIntentId", "tripId", "updatedAt", "cancellationStatus", "fullyPackaged", "greetAtPickup", "greetAtDropoff", "donateBrake", "donateTrees", "donationAmount") SELECT "acceptedAt", "cancelledAt", "createdAt", "customerId", "deliveredAt", "distanceKm", "driverId", "dropoffAddress", "dropoffLat", "dropoffLng", "dropoffPhotoUrl", "id", "lonelyCover", "lonelyCoverFee", "offerAmount", "packageNotes", "packageSize", "paymentStatus", "pickedUpAt", "pickupAddress", "pickupLat", "pickupLng", "platformFee", "preferredDate", printf('%04d', abs(random() % 9000) + 1000), "spaceNeeded", "status", "stripePaymentIntentId", "tripId", "updatedAt", 'NONE', 0, 0, 0, 0, 0, 0 FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
CREATE UNIQUE INDEX "Delivery_requestCode_key" ON "Delivery"("requestCode");
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");
CREATE INDEX "Delivery_customerId_idx" ON "Delivery"("customerId");
CREATE INDEX "Delivery_driverId_idx" ON "Delivery"("driverId");
CREATE INDEX "Delivery_tripId_idx" ON "Delivery"("tripId");
CREATE INDEX "Delivery_pickupLat_pickupLng_idx" ON "Delivery"("pickupLat", "pickupLng");
CREATE INDEX "Delivery_paymentStatus_idx" ON "Delivery"("paymentStatus");
CREATE INDEX "Delivery_requestCode_idx" ON "Delivery"("requestCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DeliveryOffer_deliveryId_idx" ON "DeliveryOffer"("deliveryId");

-- CreateIndex
CREATE INDEX "DeliveryOffer_toUserId_status_idx" ON "DeliveryOffer"("toUserId", "status");

-- CreateIndex
CREATE INDEX "DeliveryOffer_driverId_idx" ON "DeliveryOffer"("driverId");

-- CreateIndex
CREATE INDEX "Message_deliveryId_createdAt_idx" ON "Message"("deliveryId", "createdAt");

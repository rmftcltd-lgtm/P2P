-- CreateTable
CREATE TABLE "DriverTrip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "tripType" TEXT NOT NULL,
    "batchId" TEXT,
    "fromAddress" TEXT NOT NULL,
    "fromLat" REAL NOT NULL,
    "fromLng" REAL NOT NULL,
    "toAddress" TEXT NOT NULL,
    "toLat" REAL NOT NULL,
    "toLng" REAL NOT NULL,
    "departAt" DATETIME NOT NULL,
    "returnAt" DATETIME,
    "spaces" TEXT NOT NULL DEFAULT '["shoebox"]',
    "vehicleType" TEXT NOT NULL DEFAULT 'car',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DriverTrip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "packageSize" TEXT NOT NULL DEFAULT 'SMALL',
    "spaceNeeded" TEXT NOT NULL DEFAULT 'shoebox',
    "packageNotes" TEXT,
    "offerAmount" REAL NOT NULL,
    "distanceKm" REAL NOT NULL,
    "platformFee" REAL NOT NULL DEFAULT 0,
    "lonelyCover" BOOLEAN NOT NULL DEFAULT false,
    "lonelyCoverFee" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "stripePaymentIntentId" TEXT,
    "dropoffPhotoUrl" TEXT,
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
INSERT INTO "new_Delivery" ("acceptedAt", "cancelledAt", "createdAt", "customerId", "deliveredAt", "distanceKm", "driverId", "dropoffAddress", "dropoffLat", "dropoffLng", "id", "offerAmount", "packageNotes", "packageSize", "paymentStatus", "pickedUpAt", "pickupAddress", "pickupLat", "pickupLng", "platformFee", "status", "stripePaymentIntentId", "updatedAt") SELECT "acceptedAt", "cancelledAt", "createdAt", "customerId", "deliveredAt", "distanceKm", "driverId", "dropoffAddress", "dropoffLat", "dropoffLng", "id", "offerAmount", "packageNotes", "packageSize", "paymentStatus", "pickedUpAt", "pickupAddress", "pickupLat", "pickupLng", "platformFee", "status", "stripePaymentIntentId", "updatedAt" FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");
CREATE INDEX "Delivery_customerId_idx" ON "Delivery"("customerId");
CREATE INDEX "Delivery_driverId_idx" ON "Delivery"("driverId");
CREATE INDEX "Delivery_tripId_idx" ON "Delivery"("tripId");
CREATE INDEX "Delivery_pickupLat_pickupLng_idx" ON "Delivery"("pickupLat", "pickupLng");
CREATE INDEX "Delivery_paymentStatus_idx" ON "Delivery"("paymentStatus");
CREATE TABLE "new_DriverProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lat" REAL,
    "lng" REAL,
    "vehicleType" TEXT NOT NULL DEFAULT 'car',
    "rating" REAL NOT NULL DEFAULT 5.0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "kycStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "kycSubmittedAt" DATETIME,
    "licenseNumber" TEXT,
    "idDocumentNote" TEXT,
    "stripeAccountId" TEXT,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DriverProfile" ("completedCount", "id", "idDocumentNote", "isOnline", "kycStatus", "kycSubmittedAt", "lastSeenAt", "lat", "licenseNumber", "lng", "rating", "stripeAccountId", "updatedAt", "userId", "vehicleType") SELECT "completedCount", "id", "idDocumentNote", "isOnline", "kycStatus", "kycSubmittedAt", "lastSeenAt", "lat", "licenseNumber", "lng", "rating", "stripeAccountId", "updatedAt", "userId", "vehicleType" FROM "DriverProfile";
DROP TABLE "DriverProfile";
ALTER TABLE "new_DriverProfile" RENAME TO "DriverProfile";
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DriverTrip_driverId_idx" ON "DriverTrip"("driverId");

-- CreateIndex
CREATE INDEX "DriverTrip_status_idx" ON "DriverTrip"("status");

-- CreateIndex
CREATE INDEX "DriverTrip_departAt_idx" ON "DriverTrip"("departAt");

-- CreateIndex
CREATE INDEX "DriverTrip_fromLat_fromLng_idx" ON "DriverTrip"("fromLat", "fromLng");

-- CreateIndex
CREATE INDEX "DriverTrip_batchId_idx" ON "DriverTrip"("batchId");

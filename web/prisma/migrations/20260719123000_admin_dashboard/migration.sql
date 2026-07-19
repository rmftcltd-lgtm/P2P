-- AlterTable User — admin profile + status fields
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "registrationComplete" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "registrationType" TEXT;
ALTER TABLE "User" ADD COLUMN "organisationName" TEXT;
ALTER TABLE "User" ADD COLUMN "nzbn" TEXT;
ALTER TABLE "User" ADD COLUMN "dateOfBirth" TEXT;
ALTER TABLE "User" ADD COLUMN "gender" TEXT;
ALTER TABLE "User" ADD COLUMN "aboutMe" TEXT;
ALTER TABLE "User" ADD COLUMN "physicalAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "postalAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "idVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "licenceVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "hasNzLicence" BOOLEAN;

-- AlterTable Delivery
ALTER TABLE "Delivery" ADD COLUMN "timePreference" TEXT;

-- CreateTable LabelOption
CREATE TABLE "LabelOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "LabelOption_category_key_key" ON "LabelOption"("category", "key");
CREATE INDEX "LabelOption_category_sortOrder_idx" ON "LabelOption"("category", "sortOrder");

-- CreateTable ContentPage
CREATE TABLE "ContentPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT 'FOOTER',
    "metaDescription" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "ContentPage_slug_key" ON "ContentPage"("slug");

-- CreateTable UserFeedback
CREATE TABLE "UserFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "UserFeedback_status_createdAt_idx" ON "UserFeedback"("status", "createdAt");

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "urgency" TEXT NOT NULL DEFAULT 'flexible';
ALTER TABLE "Delivery" ADD COLUMN "marketplaceUrl" TEXT;

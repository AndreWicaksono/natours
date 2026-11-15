-- AlterEnum
ALTER TYPE "billing"."TransferStatus" ADD VALUE 'REVERSED';

-- DropIndex
DROP INDEX "tour"."reviews_tour_id_customer_id_key";

-- AlterTable
ALTER TABLE "billing"."stripe_webhook_events" ADD COLUMN     "completed_at" TIMESTAMPTZ(6);

-- Every existing row was fully processed before this column existed.
UPDATE "billing"."stripe_webhook_events"
SET "completed_at" = "processed_at"
WHERE "completed_at" IS NULL;

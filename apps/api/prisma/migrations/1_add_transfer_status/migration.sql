-- CreateEnum
CREATE TYPE "billing"."TransferStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- DropForeignKey
ALTER TABLE "billing"."platform_transfers" DROP CONSTRAINT "fk_booking";

-- DropForeignKey
ALTER TABLE "billing"."platform_transfers" DROP CONSTRAINT "fk_partner";

-- AlterTable
ALTER TABLE "billing"."platform_transfers" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "billing"."TransferStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "succeeded_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tour"."partners" ALTER COLUMN "stripe_account_created_at" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "platform_transfers_status_idx" ON "billing"."platform_transfers"("status");

-- AddForeignKey
ALTER TABLE "billing"."platform_transfers" ADD CONSTRAINT "platform_transfers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "tour"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."platform_transfers" ADD CONSTRAINT "platform_transfers_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "tour"."partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "billing"."idx_platform_transfers_booking_id" RENAME TO "platform_transfers_booking_id_idx";

-- RenameIndex
ALTER INDEX "billing"."idx_platform_transfers_created_at" RENAME TO "platform_transfers_created_at_idx";

-- RenameIndex
ALTER INDEX "billing"."idx_platform_transfers_partner_id" RENAME TO "platform_transfers_partner_id_idx";

-- RenameIndex
ALTER INDEX "billing"."idx_platform_transfers_status" RENAME TO "platform_transfers_status_idx";


-- AlterTable
ALTER TABLE "billing"."platform_transfers" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "billing"."TransferStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "succeeded_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tour"."partners" ALTER COLUMN "stripe_account_created_at" SET DATA TYPE TIMESTAMP(3);
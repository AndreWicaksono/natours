-- AlterTable
ALTER TABLE "billing"."platform_transfers" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" TYPE "billing"."TransferStatus" USING "status"::text::"billing"."TransferStatus",
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "succeeded_at" SET DATA TYPE TIMESTAMP(3);
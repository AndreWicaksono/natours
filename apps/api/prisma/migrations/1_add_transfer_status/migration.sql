-- CreateEnum
CREATE TYPE "auth"."AalLevel" AS ENUM ('aal1', 'aal2', 'aal3');

-- CreateEnum
CREATE TYPE "auth"."CodeChallengeMethod" AS ENUM ('s256', 'plain');

-- CreateEnum
CREATE TYPE "auth"."FactorStatus" AS ENUM ('unverified', 'verified');

-- CreateEnum
CREATE TYPE "auth"."FactorType" AS ENUM ('totp', 'webauthn', 'phone');

-- CreateEnum
CREATE TYPE "auth"."OauthAuthorizationStatus" AS ENUM ('pending', 'approved', 'denied', 'expired');

-- CreateEnum
CREATE TYPE "auth"."OauthClientType" AS ENUM ('public', 'confidential');

-- CreateEnum
CREATE TYPE "auth"."OauthRegistrationType" AS ENUM ('dynamic', 'manual');

-- CreateEnum
CREATE TYPE "auth"."OauthResponseType" AS ENUM ('code');

-- CreateEnum
CREATE TYPE "auth"."OneTimeTokenType" AS ENUM ('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');

-- CreateEnum
CREATE TYPE "billing"."TransferStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- DropForeignKey
ALTER TABLE "billing"."platform_transfers" DROP CONSTRAINT "fk_booking";

-- DropForeignKey
ALTER TABLE "billing"."platform_transfers" DROP CONSTRAINT "fk_partner";

-- AlterTable
ALTER TABLE "auth"."flow_state" DROP COLUMN "code_challenge_method",
ADD COLUMN     "code_challenge_method" "auth"."CodeChallengeMethod";

-- AlterTable
ALTER TABLE "auth"."mfa_factors" DROP COLUMN "factor_type",
ADD COLUMN     "factor_type" "auth"."FactorType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "auth"."FactorStatus" NOT NULL;

-- AlterTable
ALTER TABLE "auth"."oauth_authorizations" DROP COLUMN "code_challenge_method",
ADD COLUMN     "code_challenge_method" "auth"."CodeChallengeMethod",
DROP COLUMN "response_type",
ADD COLUMN     "response_type" "auth"."OauthResponseType" NOT NULL DEFAULT 'code',
DROP COLUMN "status",
ADD COLUMN     "status" "auth"."OauthAuthorizationStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "auth"."oauth_clients" DROP COLUMN "registration_type",
ADD COLUMN     "registration_type" "auth"."OauthRegistrationType" NOT NULL,
DROP COLUMN "client_type",
ADD COLUMN     "client_type" "auth"."OauthClientType" NOT NULL DEFAULT 'confidential';

-- AlterTable
ALTER TABLE "auth"."one_time_tokens" DROP COLUMN "token_type",
ADD COLUMN     "token_type" "auth"."OneTimeTokenType" NOT NULL;

-- AlterTable
ALTER TABLE "auth"."sessions" DROP COLUMN "aal",
ADD COLUMN     "aal" "auth"."AalLevel";

-- AlterTable
ALTER TABLE "billing"."platform_transfers" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "billing"."TransferStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "succeeded_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tour"."partners" ALTER COLUMN "stripe_account_created_at" SET DATA TYPE TIMESTAMP(3);

-- DropEnum
DROP TYPE "auth"."aal_level";

-- DropEnum
DROP TYPE "auth"."code_challenge_method";

-- DropEnum
DROP TYPE "auth"."factor_status";

-- DropEnum
DROP TYPE "auth"."factor_type";

-- DropEnum
DROP TYPE "auth"."oauth_authorization_status";

-- DropEnum
DROP TYPE "auth"."oauth_client_type";

-- DropEnum
DROP TYPE "auth"."oauth_registration_type";

-- DropEnum
DROP TYPE "auth"."oauth_response_type";

-- DropEnum
DROP TYPE "auth"."one_time_token_type";

-- CreateIndex
CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens"("user_id", "token_type");

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


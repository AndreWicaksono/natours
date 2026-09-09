-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "account";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "geography";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tour";

-- CreateEnum
CREATE TYPE "app_role" AS ENUM ('customer', 'guide', 'lead-guide', 'admin', 'partner_admin');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "location_level" AS ENUM ('country', 'province', 'city', 'district', 'sub-district', 'point-of-interest');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "tour_difficulty" AS ENUM ('easy', 'medium', 'difficult');

-- CreateEnum
CREATE TYPE "tour_status" AS ENUM ('coming_soon', 'draft', 'live');

-- CreateEnum
CREATE TYPE "billing"."TransferStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "tour"."media_type" AS ENUM ('image', 'video');


-- CreateTable
CREATE TABLE "legacy_staffs" (
    "id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "is_active" BOOLEAN DEFAULT false,
    "photo" JSONB,
    "role" TEXT DEFAULT 'Staff',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_tours" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "capacity" SMALLINT,
    "city" TEXT,
    "description" TEXT,
    "photos" JSONB,
    "price" INTEGER,
    "created_by" UUID DEFAULT auth.uid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "availability" SMALLINT DEFAULT 0,
    "is_published" BOOLEAN DEFAULT false,
    "slug" TEXT,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_users" (
    "id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "photo" JSONB,
    "role" TEXT DEFAULT 'User',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account"."profiles" (
    "id" UUID NOT NULL,
    "partner_id" BIGINT,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "role" "app_role" NOT NULL DEFAULT 'customer',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."payments" (
    "id" BIGSERIAL NOT NULL,
    "booking_id" BIGINT,
    "amount" DECIMAL,
    "currency" CHAR(3),
    "provider" TEXT,
    "stripe_session_id" TEXT,
    "provider_payment_id" TEXT,
    "status" "payment_status" DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."stripe_webhook_events" (
    "event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "geography"."location_timezones" (
    "id" BIGSERIAL NOT NULL,
    "location_id" BIGINT NOT NULL,
    "timezone_id" BIGINT NOT NULL,
    "is_primary" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_timezones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geography"."locations" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT,
    "name" TEXT,
    "level" "location_level",
    "iso_code_alpha2" CHAR(2),
    "geog" geography,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geography"."timezones" (
    "id" BIGSERIAL NOT NULL,
    "iana_name" TEXT,
    "canonical_name" TEXT,
    "display_name" TEXT,
    "region" TEXT,
    "country_codes" TEXT[],
    "utc_offset_std" interval,
    "utc_offset_dst" interval,
    "abbreviation_std" TEXT,
    "abbreviation_dst" TEXT,
    "is_canonical" BOOLEAN DEFAULT true,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "timezones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."availability_exceptions" (
    "id" BIGSERIAL NOT NULL,
    "tour_id" BIGINT,
    "unavailable_date" DATE,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "partner_id" BIGINT,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."availability_rules" (
    "id" BIGSERIAL NOT NULL,
    "tour_id" BIGINT,
    "start_date" DATE,
    "end_date" DATE,
    "days_of_week" INTEGER,
    "start_time" TIME(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "partner_id" BIGINT,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."bookings" (
    "id" BIGSERIAL NOT NULL,
    "tour_schedule_id" BIGINT,
    "customer_id" UUID,
    "seats_booked" INTEGER,
    "price_paid" DECIMAL,
    "currency_paid" CHAR(3),
    "status" "booking_status",
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "partner_id" BIGINT,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."partners" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "contact_email" TEXT,
    "website_url" TEXT,
    "is_verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "stripe_account_id" TEXT,
    "stripe_onboarding_status" TEXT DEFAULT 'pending',
    "stripe_account_created_at" TIMESTAMP(3),

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."platform_transfers" (
    "id" TEXT NOT NULL,
    "booking_id" BIGINT NOT NULL,
    "partner_id" BIGINT NOT NULL,
    "gross_amount" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "stripe_transfer_id" TEXT,
    "status" "billing"."TransferStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "succeeded_at" TIMESTAMP(3),

    CONSTRAINT "platform_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."reviews" (
    "id" BIGSERIAL NOT NULL,
    "review_text" TEXT,
    "rating" INTEGER,
    "tour_id" BIGINT,
    "customer_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."tour_guides" (
    "tour_schedule_id" BIGINT NOT NULL,
    "guide_id" UUID NOT NULL,

    CONSTRAINT "tour_guides_pkey" PRIMARY KEY ("tour_schedule_id","guide_id")
);

-- CreateTable
CREATE TABLE "tour"."tour_locations" (
    "tour_id" BIGINT NOT NULL,
    "location_id" BIGINT NOT NULL,
    "day_of_tour" INTEGER,
    "description" TEXT,

    CONSTRAINT "tour_locations_pkey" PRIMARY KEY ("tour_id","location_id")
);

-- CreateTable
CREATE TABLE "tour"."tour_media" (
    "id" BIGSERIAL NOT NULL,
    "tour_id" BIGINT,
    "media_type" "tour"."media_type",
    "url" TEXT,
    "filename" TEXT,
    "alt_text" TEXT,
    "caption" TEXT,
    "display_order" INTEGER,
    "is_cover" BOOLEAN DEFAULT false,
    "file_size" BIGINT,
    "dimensions" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "tour_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."tour_schedules" (
    "id" BIGSERIAL NOT NULL,
    "tour_id" BIGINT,
    "start_location_id" BIGINT,
    "start_date" TIMESTAMPTZ(6),
    "seats_available" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."tours" (
    "id" BIGSERIAL NOT NULL,
    "partner_id" BIGINT,
    "name" TEXT,
    "slug" TEXT,
    "duration_days" SMALLINT,
    "max_group_size" SMALLINT,
    "min_booking_size" SMALLINT DEFAULT 1,
    "difficulty" "tour_difficulty",
    "price" DECIMAL,
    "currency" CHAR(3) DEFAULT 'USD',
    "summary" TEXT,
    "description" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "tour_coordinates" geography,
    "status" "tour_status" DEFAULT 'draft',
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6),
    "is_deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,

    CONSTRAINT "tours_pkey1" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour"."wishlists" (
    "user_id" UUID NOT NULL,
    "tour_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("user_id","tour_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tours_slug_key" ON "legacy_tours"("slug");

-- CreateIndex
CREATE INDEX "profiles_partner_id_idx" ON "account"."profiles"("partner_id");

-- CreateIndex
CREATE INDEX "idx_location_timezones_is_primary" ON "geography"."location_timezones"("is_primary");

-- CreateIndex
CREATE INDEX "idx_location_timezones_location_id" ON "geography"."location_timezones"("location_id");

-- CreateIndex
CREATE INDEX "idx_location_timezones_timezone_id" ON "geography"."location_timezones"("timezone_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_timezones_location_id_timezone_id_key" ON "geography"."location_timezones"("location_id", "timezone_id");

-- CreateIndex
CREATE INDEX "idx_locations_geog" ON "geography"."locations" USING GIST ("geog");

-- CreateIndex
CREATE INDEX "locations_parent_id_idx" ON "geography"."locations"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_parent_id_name_key" ON "geography"."locations"("parent_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "timezones_iana_name_key" ON "geography"."timezones"("iana_name");

-- CreateIndex
CREATE INDEX "idx_timezones_canonical_name" ON "geography"."timezones"("canonical_name");

-- CreateIndex
CREATE INDEX "idx_timezones_country_codes" ON "geography"."timezones" USING GIN ("country_codes");

-- CreateIndex
CREATE INDEX "idx_timezones_iana_name" ON "geography"."timezones"("iana_name");

-- CreateIndex
CREATE INDEX "idx_timezones_is_canonical" ON "geography"."timezones"("is_canonical");

-- CreateIndex
CREATE INDEX "idx_timezones_region" ON "geography"."timezones"("region");

-- CreateIndex
CREATE INDEX "availability_exceptions_partner_id_idx" ON "tour"."availability_exceptions"("partner_id");

-- CreateIndex
CREATE INDEX "availability_exceptions_tour_id_idx" ON "tour"."availability_exceptions"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "availability_exceptions_tour_id_unavailable_date_key" ON "tour"."availability_exceptions"("tour_id", "unavailable_date");

-- CreateIndex
CREATE INDEX "availability_rules_partner_id_idx" ON "tour"."availability_rules"("partner_id");

-- CreateIndex
CREATE INDEX "availability_rules_tour_id_idx" ON "tour"."availability_rules"("tour_id");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "tour"."bookings"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_partner_id_idx" ON "tour"."bookings"("partner_id");

-- CreateIndex
CREATE INDEX "bookings_tour_schedule_id_idx" ON "tour"."bookings"("tour_schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "partners_name_key" ON "tour"."partners"("name");

-- CreateIndex
CREATE UNIQUE INDEX "partners_contact_email_key" ON "tour"."partners"("contact_email");

-- CreateIndex
CREATE UNIQUE INDEX "partners_stripe_account_id_key" ON "tour"."partners"("stripe_account_id");

-- CreateIndex
CREATE INDEX "platform_transfers_booking_id_idx" ON "billing"."platform_transfers"("booking_id");

-- CreateIndex
CREATE INDEX "platform_transfers_partner_id_idx" ON "billing"."platform_transfers"("partner_id");

-- CreateIndex
CREATE INDEX "platform_transfers_status_idx" ON "billing"."platform_transfers"("status");

-- CreateIndex
CREATE INDEX "platform_transfers_created_at_idx" ON "billing"."platform_transfers"("created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_customer_id_idx" ON "tour"."reviews"("customer_id");

-- CreateIndex
CREATE INDEX "reviews_tour_id_idx" ON "tour"."reviews"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_tour_id_customer_id_key" ON "tour"."reviews"("tour_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "tour_media_unique_cover_idx" ON "tour"."tour_media"("tour_id") WHERE (is_cover = true);

-- CreateIndex
CREATE INDEX "tour_media_tour_id_idx" ON "tour"."tour_media"("tour_id");

-- CreateIndex
CREATE INDEX "tour_media_tour_id_order_idx" ON "tour"."tour_media"("tour_id", "display_order");

-- CreateIndex
CREATE INDEX "tour_schedules_tour_id_idx" ON "tour"."tour_schedules"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "tour_schedules_tour_id_start_date_key" ON "tour"."tour_schedules"("tour_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "tours_slug_key1" ON "tour"."tours"("slug");

-- CreateIndex
CREATE INDEX "tours_created_by_idx" ON "tour"."tours"("created_by");

-- CreateIndex
CREATE INDEX "tours_is_deleted_idx" ON "tour"."tours"("is_deleted");

-- CreateIndex
CREATE INDEX "tours_partner_id_idx" ON "tour"."tours"("partner_id");

-- AddForeignKey
ALTER TABLE "legacy_staffs" ADD CONSTRAINT "staffs_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legacy_tours" ADD CONSTRAINT "tours_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legacy_users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "account"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "account"."profiles" ADD CONSTRAINT "profiles_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "tour"."partners"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "tour"."bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "geography"."location_timezones" ADD CONSTRAINT "location_timezones_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "geography"."locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "geography"."location_timezones" ADD CONSTRAINT "location_timezones_timezone_id_fkey" FOREIGN KEY ("timezone_id") REFERENCES "geography"."timezones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "geography"."locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "geography"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."availability_exceptions" ADD CONSTRAINT "availability_exceptions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "tour"."partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."availability_exceptions" ADD CONSTRAINT "availability_exceptions_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tour"."tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."availability_rules" ADD CONSTRAINT "availability_rules_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "tour"."partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."availability_rules" ADD CONSTRAINT "availability_rules_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tour"."tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."bookings" ADD CONSTRAINT "bookings_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "tour"."partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."bookings" ADD CONSTRAINT "bookings_tour_schedule_id_fkey" FOREIGN KEY ("tour_schedule_id") REFERENCES "tour"."tour_schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "billing"."platform_transfers" ADD CONSTRAINT "platform_transfers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "tour"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."platform_transfers" ADD CONSTRAINT "platform_transfers_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "tour"."partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour"."reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."reviews" ADD CONSTRAINT "reviews_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tour"."tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tour_guides" ADD CONSTRAINT "tour_guides_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tour_guides" ADD CONSTRAINT "tour_guides_tour_schedule_id_fkey" FOREIGN KEY ("tour_schedule_id") REFERENCES "tour"."tour_schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tour_locations" ADD CONSTRAINT "tour_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "geography"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tour_locations" ADD CONSTRAINT "tour_locations_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tour"."tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tour_media" ADD CONSTRAINT "tour_media_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tour"."tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tour_schedules" ADD CONSTRAINT "tour_schedules_start_location_id_fkey" FOREIGN KEY ("start_location_id") REFERENCES "geography"."locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tour_schedules" ADD CONSTRAINT "tour_schedules_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tour"."tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tours" ADD CONSTRAINT "tours_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tours" ADD CONSTRAINT "tours_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."tours" ADD CONSTRAINT "tours_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "tour"."partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."wishlists" ADD CONSTRAINT "wishlists_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tour"."tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour"."wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;


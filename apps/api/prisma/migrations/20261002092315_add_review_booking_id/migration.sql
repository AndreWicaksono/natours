/*
  Warnings:

  - A unique constraint covering the columns `[booking_id]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `booking_id` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tour"."reviews" ADD COLUMN     "booking_id" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "tour"."reviews"("booking_id");

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { BookingStatus } from '../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BookingStatusService {
  private readonly logger = new Logger(BookingStatusService.name);

  constructor(private prisma: PrismaService) { }

  // `timeZone: 'UTC'` is required for "1 AM UTC" to actually mean UTC — without it,
  // @nestjs/schedule evaluates the cron expression in the server's local timezone.
  @Cron('0 1 * * *', { timeZone: 'UTC' })
  async updateBookingStatuses() {
    const now = new Date();

    // Compare against UTC midnight so the boundary is consistent with `startDate`
    // (timestamptz) regardless of the server's locale.
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    // 1. CONFIRMED → NO_SHOW (tour start date is in the past and no check-in occurred)
    const noShows = await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.CONFIRMED,
        tourSchedule: { startDate: { lt: todayUtc } },
      },
      data: { status: BookingStatus.NO_SHOW },
    });

    // 2. ONGOING → COMPLETED, only once the tour's END (startDate + durationDays) has passed.
    //
    // Deliberately NOT raw SQL: `$queryRaw` bypasses Prisma's enum `@map`, so
    // `BookingStatus.ONGOING` would be sent to Postgres as 'ONGOING' while the database
    // enum labels are lowercase ('ongoing' / 'completed') — the query would fail.
    // Doing the date arithmetic in TypeScript and updating by id keeps this fully
    // type-checked and enum-mapped. ONGOING bookings are a small set (only checked-in
    // customers on tours currently running), so loading them is cheap.
    const ongoing = await this.prisma.booking.findMany({
      where: { status: BookingStatus.ONGOING },
      select: {
        id: true,
        tourSchedule: {
          select: {
            startDate: true,
            tour: { select: { durationDays: true } },
          },
        },
      },
    });

    const finishedIds = ongoing
      .filter(({ tourSchedule }) => {
        const start = tourSchedule?.startDate;
        const days = tourSchedule?.tour?.durationDays;
        if (start == null || days == null) return false;
        return start.getTime() + days * DAY_MS < now.getTime();
      })
      .map((b) => b.id);

    // Re-assert `status: ONGOING` in the update so a booking that changed state between
    // the read above and this write (e.g. cancelled by an admin) is never overwritten.
    const completed = finishedIds.length
      ? await this.prisma.booking.updateMany({
        where: { id: { in: finishedIds }, status: BookingStatus.ONGOING },
        data: { status: BookingStatus.COMPLETED },
      })
      : { count: 0 };

    this.logger.log(
      `🔄 Cron updateBookingStatuses: ${noShows.count} → NO_SHOW, ${completed.count} → COMPLETED`,
    );
  }
}
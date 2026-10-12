import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(private prisma: PrismaService) {}

  async getAvailableDates(tourId: number, month: number, year: number) {
    // BUG-7 FIX: Use findMany to get ALL rules for a tour instead of just findFirst.
    // A tour might have one rule for weekends and another for weekdays. findFirst
    // silently ignored all but the first rule, resulting in incomplete availability.
    const rules = await this.prisma.availabilityRule.findMany({
      where: { tourId },
    });

    if (!rules || rules.length === 0) {
      this.logger.debug(`No availability rules found for tour ${tourId}`);
      return [];
    }

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const exceptions = await this.prisma.availabilityException.findMany({
      where: {
        tourId,
        unavailableDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: { unavailableDate: true },
    });

    const exceptionDates = new Set(
      exceptions
        .filter((e) => e.unavailableDate !== null)
        .map((e) => e.unavailableDate!.toISOString().slice(0, 10)),
    );

    const availableSlots: string[] = [];
    const now = new Date();

    // Iterate over every day in the month
    const currentDate = new Date(startOfMonth);
    while (currentDate <= endOfMonth) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const dayOfWeek = currentDate.getUTCDay();

      // Skip exceptions entirely for this day
      if (!exceptionDates.has(dateStr)) {
        // Test all rules against this date
        for (const rule of rules) {
          if (!rule.startDate || !rule.startTime) continue;

          const withinRange =
            currentDate >= rule.startDate &&
            (!rule.endDate || currentDate <= rule.endDate);

          const dayMatches =
            rule.daysOfWeek !== null
              ? (rule.daysOfWeek & (1 << dayOfWeek)) !== 0
              : false;

          if (withinRange && dayMatches) {
            // Generate the slot for this rule
            const startTime = new Date(rule.startTime);
            const hours = startTime.getUTCHours();
            const minutes = startTime.getUTCMinutes();

            const departure = new Date(currentDate);
            departure.setUTCHours(hours, minutes, 0, 0);

            // Check departure is at least 1 hour from now
            const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000);
            if (departure > minBookingTime) {
              availableSlots.push(departure.toISOString());
            }
          }
        }
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Deduplicate slots (in case overlapping rules generate the same exact time)
    const uniqueSlots = Array.from(new Set(availableSlots)).sort();

    const grouped: Record<string, string[]> = {};
    for (const iso of uniqueSlots) {
      const dateKey = iso.slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(iso);
    }

    return Object.entries(grouped).map(([date, times]) => ({ date, times }));
  }
}
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
// BP-3 FIX: Removed unused `import { JwtAuthGuard }` — JwtAuthGuard is registered
// globally in main.ts (app.useGlobalGuards), so re-importing it here was misleading.
// The documented pattern for this project is @UseGuards(RolesGuard) only on controllers.
import type { UserPayload } from '../auth/user-payload.interface';
import { AppRole } from '../generated/prisma/enums';
import { Public } from '../auth/public.decorator';
import { ExpirationService } from './expiration.service';

@Controller('bookings')
@UseGuards(RolesGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly expirationService: ExpirationService,
    private readonly configService: ConfigService,
  ) { }

  @Post()
  @Roles(AppRole.CUSTOMER, AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBookingWithCheckout(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.bookingsService.findAll(user);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.findOne(user, id);
  }

  // BUG-6 FIX: Removed PATCH /bookings/:id/confirm endpoint.
  // Booking confirmation must ONLY happen via the Stripe `checkout.session.completed`
  // webhook. The manual endpoint let ADMIN/PARTNER_ADMIN confirm any booking without
  // a Stripe payment event ever occurring — creating confirmed bookings with no payment
  // record and no PlatformTransfer. `bookingsService.confirmBooking()` is still called
  // correctly from the webhook handler in `stripe-webhook.controller.ts`.

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.cancelBooking(user, id);
  }

  @Post(':id/resume-payment')
  @Roles(AppRole.CUSTOMER)
  resumePayment(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.resumePayment(user, id);
  }

  @Patch(':id/check-in')
  @Roles(AppRole.CUSTOMER, AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  async checkIn(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.checkIn(user, id);
  }

  // BP-4 FIX: `test-expire` is a public endpoint that triggers mass seat releases, so it
  // must be default-deny: it only works when NODE_ENV is explicitly 'development'.
  // (A `=== 'production'` check fails open — an unset or misspelled NODE_ENV on a
  // deployed server would leave this endpoint publicly callable.) It throws a real 404
  // rather than returning an error body with a 200, so the route looks nonexistent
  // everywhere else. Remove this endpoint entirely once real tests cover expiration.
  @Post('test-expire')
  @Public()
  async testExpire() {
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      throw new NotFoundException();
    }
    await this.expirationService.handleExpiredBookings();
    return { message: 'Expiration job triggered manually' };
  }
}
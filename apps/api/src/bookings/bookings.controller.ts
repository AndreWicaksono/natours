import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import type { UserPayload } from '../auth/user-payload.interface';
import { AppRole } from '../generated/prisma/enums';
import { Public } from 'src/auth/public.decorator';
import { ExpirationService } from './expiration.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly expirationService: ExpirationService,
  ) {}

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

  @Patch(':id/confirm')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  confirm(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Call the correct method name: confirmBooking
    return this.bookingsService.confirmBooking(id);
  }

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

  // In bookings.controller.ts
  @Post('test-expire')
  @Public()
  async testExpire() {
    await this.expirationService.handleExpiredBookings();
    return { message: 'Expiration job triggered manually' };
  }
}

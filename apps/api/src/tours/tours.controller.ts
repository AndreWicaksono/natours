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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AppRole, TourStatus } from '../generated/prisma/enums';
import type { UserPayload } from '../auth/user-payload.interface';
import { AvailabilityService } from './availability.service';

@Controller('tours')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ToursController {
  constructor(
    private readonly toursService: ToursService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Post()
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN) // <-- Now works
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateTourDto) {
    return this.toursService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.toursService.findAll(user);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.toursService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  update(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTourDto,
  ) {
    return this.toursService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  remove(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.toursService.remove(user, id);
  }

  @Patch(':id/restore')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  restore(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.toursService.restore(user, id);
  }

  @Patch(':id/status')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  updateStatus(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: TourStatus,
  ) {
    return this.toursService.updateStatus(user, id, status);
  }

  @Public()
  @Get('public/tours')
  getPublicTours() {
    return { message: 'Public tours endpoint' };
  }

  /**
   * Get available dates for a tour in a specific month.
   * Public endpoint – no authentication required.
   */
  @Get(':id/availability')
  @Public()
  async getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    // Validate month range (1-12)
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12.');
    }

    // Validate year range (e.g., not too far in the past/future)
    const currentYear = new Date().getFullYear();
    if (year < currentYear - 10 || year > currentYear + 10) {
      throw new BadRequestException(
        `Year must be between ${currentYear - 10} and ${currentYear + 10}.`,
      );
    }

    return this.availabilityService.getAvailableDates(id, month, year);
  }
}

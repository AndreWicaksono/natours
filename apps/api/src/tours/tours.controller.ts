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

@Controller('tours')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

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
  findOne(@CurrentUser() user: UserPayload, @Param('id', ParseIntPipe) id: number) {
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
  remove(@CurrentUser() user: UserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.toursService.remove(user, id);
  }

  @Patch(':id/restore')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  restore(@CurrentUser() user: UserPayload, @Param('id', ParseIntPipe) id: number) {
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
}
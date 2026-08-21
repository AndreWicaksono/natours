import { Module } from '@nestjs/common';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { AvailabilityService } from './availability.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ToursController],
  providers: [ToursService, AvailabilityService],
  exports: [ToursService, AvailabilityService],
})
export class ToursModule {}
import { Module } from '@nestjs/common';

import { PartnersController } from './partners.controller';
import { PartnersConnectService } from './partners-connect.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartnersController],
  providers: [PartnersConnectService],
  exports: [PartnersConnectService],
})
export class PartnersModule {}

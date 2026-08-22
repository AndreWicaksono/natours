import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { PartnersConnectService } from './partners-connect.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AppRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
// ✅ Use import type for UserPayload (decorated signature)
import type { UserPayload } from '../auth/user-payload.interface';

@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  constructor(
    private readonly connectService: PartnersConnectService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':id/onboarding')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  async startOnboarding(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      select: { contactEmail: true },
    });

    if (!partner) {
      return { error: 'Partner not found.' };
    }

    const result = await this.connectService.generateOnboardingLink(
      id,
      partner.contactEmail || user.email || 'partner@example.com',
    );

    return result;
  }

  @Get('onboarding/complete')
  @Public()
  async onboardingComplete(@Query('account_id') accountId: string) {
    return {
      message: 'Onboarding complete! You can now receive payments.',
      accountId,
    };
  }

  @Get('onboarding/refresh')
  @Public()
  async onboardingRefresh() {
    return {
      message: 'Please try onboarding again.',
    };
  }

  @Get(':id/connect-status')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  async getConnectStatus(@Param('id', ParseIntPipe) id: number) {
    // ✅ Select the new fields
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      select: {
        stripeAccountId: true,
        stripeOnboardingStatus: true,
      },
    });

    if (!partner) {
      return { error: 'Partner not found.' };
    }

    if (!partner.stripeAccountId) {
      return {
        status: 'not_started',
        message: 'Partner has not started Stripe Connect onboarding.',
      };
    }

    const status = await this.connectService.getAccountStatus(partner.stripeAccountId);

    return {
      stripeAccountId: partner.stripeAccountId,
      onboardingStatus: partner.stripeOnboardingStatus,
      details: status,
    };
  }
}
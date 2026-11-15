import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PartnersConnectService } from './partners-connect.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
// ✅ Use import type for UserPayload (decorated signature)
import type { UserPayload } from '../auth/user-payload.interface';

@Controller('partners')
@UseGuards(RolesGuard)
export class PartnersController {
  constructor(
    private readonly connectService: PartnersConnectService,
    private readonly prisma: PrismaService,
  ) {}

  // Partner isolation. @Roles(ADMIN, PARTNER_ADMIN) only says WHICH ROLES may call these
  // routes — it says nothing about WHICH partner. Without this check, any PARTNER_ADMIN
  // could start Stripe onboarding for, or read the Connect status of, any other partner
  // just by changing the id in the URL.
  //
  // Called before any database lookup on purpose: a partner admin probing someone else's
  // id (or a nonexistent one) gets the same 403, so ids can't be enumerated through
  // 404-vs-403 differences.
  private assertCanManagePartner(user: UserPayload, partnerId: number) {
    if (user.role === AppRole.ADMIN) return; // platform admins may manage any partner

    // `UserPayload.partnerId` is declared `number | null`, but it comes straight from
    // Prisma's BigInt column, so at runtime it is a `bigint` (2n). `partnerId` here is a
    // `number` (2) produced by ParseIntPipe. In JavaScript `2n !== 2` is ALWAYS true —
    // strict comparison never crosses types — so comparing them directly rejected every
    // partner admin, including the owner of the partner. BigInt() accepts either type, so
    // converting both sides compares values whatever the runtime type turns out to be.
    if (
      user.partnerId == null ||
      BigInt(user.partnerId) !== BigInt(partnerId)
    ) {
      throw new ForbiddenException('You do not have access to this partner.');
    }
  }

  @Post(':id/onboarding')
  @Roles(AppRole.ADMIN, AppRole.PARTNER_ADMIN)
  async startOnboarding(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ) {
    this.assertCanManagePartner(user, id);

    const partner = await this.prisma.partner.findUnique({
      where: { id },
      select: { contactEmail: true },
    });

    if (!partner) {
      // BP-5 FIX: Throw HTTP exception instead of returning a 200 JSON object with an error string
      throw new NotFoundException('Partner not found.');
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
  async getConnectStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ) {
    this.assertCanManagePartner(user, id);

    // ✅ Select the new fields
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      select: {
        stripeAccountId: true,
        stripeOnboardingStatus: true,
      },
    });

    if (!partner) {
      // BP-5 FIX
      throw new NotFoundException('Partner not found.');
    }

    if (!partner.stripeAccountId) {
      return {
        status: 'not_started',
        message: 'Partner has not started Stripe Connect onboarding.',
      };
    }

    const status = await this.connectService.getAccountStatus(
      partner.stripeAccountId,
    );

    return {
      stripeAccountId: partner.stripeAccountId,
      onboardingStatus: partner.stripeOnboardingStatus,
      details: status,
    };
  }
}

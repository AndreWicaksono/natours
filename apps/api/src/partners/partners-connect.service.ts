import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PartnersConnectService {
  private readonly logger = new Logger(PartnersConnectService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }
    // ✅ Omit apiVersion to use the default (avoids version mismatch)
    this.stripe = new Stripe(secretKey);
  }

  async generateOnboardingLink(
    partnerId: number,
    email: string,
  ): Promise<{ onboardingUrl: string }> {
    // ✅ Select the new fields
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        stripeAccountId: true,
        stripeOnboardingStatus: true,
      },
    });

    if (!partner) {
      throw new BadRequestException('Partner not found.');
    }

    let stripeAccountId = partner.stripeAccountId;

    if (!stripeAccountId) {
      try {
        const account = await this.stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: {
            partnerId: partnerId.toString(),
          },
        });

        stripeAccountId = account.id;

        // ✅ Use the new fields
        await this.prisma.partner.update({
          where: { id: partnerId },
          data: {
            stripeAccountId: stripeAccountId,
            stripeOnboardingStatus: 'pending',
            stripeAccountCreatedAt: new Date(),
          },
        });

        this.logger.log(
          `✅ Stripe Express account created for partner ${partnerId}: ${stripeAccountId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create Stripe account for partner ${partnerId}: ${error.message}`,
        );
        throw new BadRequestException(
          'Unable to create Stripe account. Please try again later.',
        );
      }
    }

    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${this.configService.get('SITE_URL')}/partners/onboarding/refresh`,
        return_url: `${this.configService.get('SITE_URL')}/partners/onboarding/complete`,
        type: 'account_onboarding',
      });

      this.logger.log(`🔗 Account link generated for partner ${partnerId}`);
      return { onboardingUrl: accountLink.url };
    } catch (error) {
      this.logger.error(
        `Failed to generate account link for partner ${partnerId}: ${error.message}`,
      );
      throw new BadRequestException(
        'Unable to generate onboarding link. Please try again later.',
      );
    }
  }

  async getAccountStatus(stripeAccountId: string) {
    try {
      const account = await this.stripe.accounts.retrieve(stripeAccountId);
      return {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve account status: ${error.message}`);
      throw new BadRequestException('Unable to fetch account status.');
    }
  }
}

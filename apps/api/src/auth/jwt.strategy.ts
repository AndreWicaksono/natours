import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from './jwt-payload.interface';

import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['ES256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.sub;

    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        partnerId: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    if (!profile) {
      throw new UnauthorizedException('User profile not found');
    }

    return {
      id: userId,
      email: payload.email,
      role: profile.role,
      partnerId: profile.partnerId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
    };
  }
}

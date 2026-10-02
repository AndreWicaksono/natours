import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from './jwt-payload.interface';
import { PrismaService } from 'src/prisma/prisma.service';

function decodeJwtHeader(token: string): { alg?: string } {
  try {
    const [headerB64] = token.split('.');
    return JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwksSecretProvider = passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${configService.get<string>('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Both allowed — see the note below on why this is NOT an
      // algorithm-confusion vulnerability despite mixing symmetric
      // and asymmetric here.
      algorithms: ['ES256', 'HS256'],
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const { alg } = decodeJwtHeader(rawJwtToken);

        if (alg === 'HS256') {
          // Local Supabase's legacy symmetric signing (CLI < v2.71.1,
          // or any environment without ES256 signing keys configured).
          // Set SUPABASE_JWT_SECRET in .env to the value `supabase
          // status` prints as "JWT secret: ..." for local dev.
          return done(null, configService.get<string>('SUPABASE_JWT_SECRET'));
        }

        // ES256 (or RS256) — live Supabase's asymmetric signing keys,
        // or a local instance with signing keys explicitly configured.
        return jwksSecretProvider(request, rawJwtToken, done);
      },
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
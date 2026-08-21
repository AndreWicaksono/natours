import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { BigIntInterceptor } from './common/interceptors/big-int.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Keep this – it may help with other parsers
  });

  // ✅ CRITICAL: Raw body middleware for the webhook route, placed FIRST.
  // This captures the raw request body as a Buffer.
  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

  // For all other routes, use the standard JSON parser.
  app.use(express.json());

  const reflector = app.get(Reflector);

  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new BigIntInterceptor());

  await app.listen(3000);
}
bootstrap();
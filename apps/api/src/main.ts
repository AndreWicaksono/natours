import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

import { JwtAuthGuard } from './auth/jwt-auth.guard';

import { BigIntInterceptor } from './common/interceptors/big-int.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  // Global Guards
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Strip properties not in the DTO
      transform: true,              // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true,   // Throw error if extra properties are sent
    }),
  );

    // Global Interceptor for BigInt serialization
  app.useGlobalInterceptors(new BigIntInterceptor());

  await app.listen(3000);
}
bootstrap();
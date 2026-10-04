import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from './auth/current-user.decorator';
import { Public } from './auth/public.decorator';

import type { UserPayload } from './auth/user-payload.interface';

@Controller()
export class AppController {
  @Get('profile')
  getProfile(@CurrentUser() user: UserPayload) {
    return user;
  }

  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
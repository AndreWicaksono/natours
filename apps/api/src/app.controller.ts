import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from './auth/current-user.decorator';
import { Public } from './auth/public.decorator';
import { Roles } from './auth/roles.decorator';

import { AppRole } from './generated/prisma/enums';

@Controller()
export class AppController {
  @Get('profile')
  @Roles(AppRole.ADMIN) // only admin can access this example
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
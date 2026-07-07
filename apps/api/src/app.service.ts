import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    console.log('DB URL:', dbUrl);
  }
}
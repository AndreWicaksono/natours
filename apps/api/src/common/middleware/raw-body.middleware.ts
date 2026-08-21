import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only apply to the webhook route (optional: you can check path here)
    let rawBody = '';

    req.on('data', (chunk) => {
      rawBody += chunk;
    });

    req.on('end', () => {
      // Attach raw body to the request object
      (req as any).rawBody = rawBody;
      next();
    });

    req.on('error', (err) => {
      console.error('Raw body middleware error:', err);
      next(err);
    });
  }
}
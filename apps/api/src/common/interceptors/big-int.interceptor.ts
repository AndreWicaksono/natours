import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.convertBigInt(data)),
    );
  }

  private convertBigInt(value: any, seen = new WeakSet()): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'object') {
      // Prevent infinite recursion on circular references
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);

      if (Array.isArray(value)) {
        return value.map((v) => this.convertBigInt(v, seen));
      } else {
        const result: any = {};
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = this.convertBigInt(value[key], seen);
          }
        }
        return result;
      }
    }
    return value;
  }
}
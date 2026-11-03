import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Adds a Server-Timing header with the time spent after the guards ran
 * (pipes + handler). Browsers' devtools and most load-test tools display it.
 */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const started = performance.now();
    const response = context.switchToHttp().getResponse<Response>();
    const stamp = (): void => {
      if (!response.headersSent) {
        response.setHeader('Server-Timing', `app;dur=${(performance.now() - started).toFixed(1)}`);
      }
    };

    // tap's next/error callbacks run before Nest writes the response (or the exception filter
    // runs), so the header still makes it onto the wire. finalize() would run too late.
    return next.handle().pipe(tap({ next: stamp, error: stamp }));
  }
}

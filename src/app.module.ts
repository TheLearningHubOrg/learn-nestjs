import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';
import { ApiKeyGuard } from './common/guards/api-key.guard.js';
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { appConfig, validateEnv } from './config/app.config.js';
import { HealthModule } from './health/health.module.js';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [
    // isGlobal: every module can inject ConfigService without importing ConfigModule again.
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig], validate: validateEnv }),
    HealthModule,
    TasksModule,
  ],
  providers: [
    // Global enhancers registered as providers take part in DI (they can inject ConfigService,
    // Reflector, ...) and are active in tests built with Test.createTestingModule().
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Express 5 / path-to-regexp 8 syntax: a named wildcard, not a bare "*".
    consumer.apply(RequestIdMiddleware).forRoutes('{*splat}');
  }
}

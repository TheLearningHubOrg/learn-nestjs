import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // NestJS 12.1+: helmet-equivalent defaults (CSP, HSTS, nosniff, ...) and no X-Powered-By.
  app.useSecurityHeaders();

  // Run OnModuleDestroy / OnApplicationShutdown hooks on SIGTERM (docker stop, Kubernetes).
  app.enableShutdownHooks();

  // Containers need 0.0.0.0; "localhost" would only accept connections from inside the container.
  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');
  Logger.log(`Listening on http://0.0.0.0:${port}`, 'Bootstrap');
}

await bootstrap();

import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  apiKey: string | undefined;
}

/** Namespaced config: read with config.get('app.apiKey') or inject with @Inject(appConfig.KEY). */
export const appConfig = registerAs('app', (): AppConfig => ({
  port: Number(process.env.PORT ?? 8080),
  apiKey: process.env.API_KEY || undefined,
}));

/**
 * Runs once at startup against process.env (plus any .env file). Throwing here stops the app
 * before it accepts traffic: a bad PORT should fail the deploy, not the first request.
 */
export function validateEnv(
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  if (env.PORT !== undefined) {
    const port = Number(env.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`PORT must be an integer between 1 and 65535, got "${env.PORT}"`);
    }
  }
  const apiKey = env.API_KEY ?? '';
  if (apiKey.length > 0 && apiKey.length < 8) {
    throw new Error('API_KEY must be at least 8 characters long');
  }
  return env;
}

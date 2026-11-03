import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorators/public.decorator.js';
import { ApiKeyGuard } from './api-key.guard.js';

class Handlers {
  @Public()
  open(): void {}

  locked(): void {}
}

/** Builds the smallest ExecutionContext the guard needs. */
function contextFor(
  handler: keyof Handlers,
  headers: Record<string, string> = {},
): ExecutionContext {
  const request = { header: (name: string) => headers[name.toLowerCase()] };
  return {
    getHandler: () => Handlers.prototype[handler],
    getClass: () => Handlers,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function guardWithKey(apiKey: string | undefined): ApiKeyGuard {
  const config = new ConfigService({ app: { apiKey } });
  return new ApiKeyGuard(new Reflector(), config);
}

describe('ApiKeyGuard', () => {
  it('lets @Public() handlers through without a key', () => {
    expect(guardWithKey(undefined).canActivate(contextFor('open'))).toBe(true);
  });

  it('accepts the configured key', () => {
    const ctx = contextFor('locked', { 'x-api-key': 'correct-horse' });
    expect(guardWithKey('correct-horse').canActivate(ctx)).toBe(true);
  });

  it('rejects a wrong key', () => {
    const ctx = contextFor('locked', { 'x-api-key': 'wrong-key!' });
    expect(() => guardWithKey('correct-horse').canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('fails closed when no key is configured', () => {
    const ctx = contextFor('locked', { 'x-api-key': 'anything' });
    expect(() => guardWithKey(undefined).canActivate(ctx)).toThrow(UnauthorizedException);
  });
});

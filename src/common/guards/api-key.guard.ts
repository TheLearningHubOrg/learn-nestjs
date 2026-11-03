import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { Public } from '../decorators/public.decorator.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Handler metadata wins over class metadata.
    const isPublic = this.reflector.getAllAndOverride(Public, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const expected = this.config.get<string>('app.apiKey');
    if (!expected) {
      // Fail closed: a missing secret must never mean "everyone is allowed".
      this.logger.warn('API_KEY is not set; rejecting every protected request');
      throw new UnauthorizedException('API key authentication is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-api-key') ?? '';
    if (!safeEqual(provided, expected)) {
      throw new UnauthorizedException('Missing or invalid x-api-key header');
    }
    return true;
  }
}

/** Constant-time comparison so response timing does not leak how many characters matched. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

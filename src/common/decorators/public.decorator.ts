import { Reflector } from '@nestjs/core';

/**
 * Marks a handler or controller as reachable without an API key.
 * Reflector.createDecorator() returns a typed decorator that is also the metadata key,
 * so guards read it with reflector.getAllAndOverride(Public, [...]) and need no string constant.
 */
export const Public = Reflector.createDecorator<void, boolean>({ transform: () => true });

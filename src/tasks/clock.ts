/** Injection token for "what time is it": tests replace it to get deterministic timestamps. */
export const CLOCK = Symbol('CLOCK');

export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

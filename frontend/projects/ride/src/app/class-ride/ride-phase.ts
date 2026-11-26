/**
 * The stage a class ride is in (ADR 0049, docs/detailed-designs/class-ride/count-down-to-the-start): `waiting` while
 * Ibiza Flyover shows (a ride with the class video has none), `countdown` from "3" to "Go!", `riding` from "Go!" to
 * 20:00, then `finished` under the finish banner and `rolling-out` until Class Done opens. The ride's clock runs only
 * in `riding`.
 */
export type RidePhase = 'waiting' | 'countdown' | 'riding' | 'finished' | 'rolling-out';

import type { Signal } from '@angular/core';
import { InjectionToken } from '@angular/core';

/**
 * The ride's music (L2-176): one track, played in the background of a ride in Ibiza while the rider's sound is Music
 * (L2-185), and nowhere else. Nothing is fetched until `play` is first called.
 */
export interface RideMusic {
  /** False once the track could not be loaded or the browser refused to play it (L2-176 AC7). */
  readonly available: Signal<boolean>;
  /** Plays the track from where it was, looping; the first call fetches it. */
  play(): void;
  /** Holds the track where it is. */
  pause(): void;
  /** Stops the track and lets go of its element and buffers. */
  release(): void;
}

export const RIDE_MUSIC = new InjectionToken<RideMusic>('RIDE_MUSIC');

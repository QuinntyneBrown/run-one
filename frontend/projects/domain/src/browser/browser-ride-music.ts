import { Injectable, signal } from '@angular/core';
import type { RideMusic } from '@telo/api';

/** The one track, served by the app's own origin (L2-176 AC2): Beautiful Boom Bap by Music_Unlimited. */
export const RIDE_MUSIC_PATH = 'music/beautiful-boom-bap.mp3';

/**
 * `RideMusic` on an `HTMLAudioElement` that loops (L2-176 AC1). The element is made, and the track fetched, by the
 * first `play`; a track that cannot be loaded, or a browser that refuses to play it, makes the
 * music unavailable and leaves the ride as it is (AC7). Whether it plays is the rider's sound (L2-185). `release` pauses
 * the element, drops its source so the browser lets go of the buffered track, and forgets it (AC6). The element
 * keeps playing in a hidden tab, as the ride's clock keeps running (AC8).
 */
@Injectable()
export class BrowserRideMusic implements RideMusic {
  private readonly isAvailable = signal(true);
  private audio: HTMLAudioElement | null = null;

  readonly available = this.isAvailable.asReadonly();

  play(): void {
    if (!this.isAvailable()) return;
    if (!this.audio) {
      const audio = new Audio(RIDE_MUSIC_PATH);
      audio.loop = true;
      audio.addEventListener('error', () => this.isAvailable.set(false));
      this.audio = audio;
    }
    this.audio.play().catch(() => this.isAvailable.set(false));
  }

  pause(): void {
    this.audio?.pause();
  }

  release(): void {
    const audio = this.audio;
    if (!audio) return;
    this.audio = null;
    // The next ride tries the track again.
    this.isAvailable.set(true);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
}

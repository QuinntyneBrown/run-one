import type { Signal } from '@angular/core';
import { InjectionToken } from '@angular/core';

/** What plays in a ride in Ibiza (L2-185, ADR 0050). */
export type Sound = 'music' | 'none' | 'youtube-video' | 'youtube-audio';

/** Which YouTube video a YouTube sound plays: the default video, or the class's own in time with the ride. */
export type SoundVideo = 'default' | 'class';

/** The rider's choice of sound for a ride in Ibiza, kept on this device and sent nowhere (L2-185 AC3). */
export interface RideSound {
  readonly sound: Signal<Sound>;
  readonly video: Signal<SoundVideo>;
  /** Chooses the sound, and keeps it for the next ride. */
  choose(sound: Sound): void;
  /** Chooses the video, and keeps it for the next ride. */
  chooseVideo(video: SoundVideo): void;
}

export const RIDE_SOUND = new InjectionToken<RideSound>('RIDE_SOUND');

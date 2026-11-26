import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type { RideSound, Sound, SoundVideo } from '@telo/api';

/** Where the sound lives in localStorage. */
export const RIDE_SOUND_KEY = 'telo-ride.sound';
/** Where the video a YouTube sound plays lives. */
export const RIDE_SOUND_VIDEO_KEY = 'telo-ride.sound-video';
/** Where slice 37.6's Music toggle kept "off" (L2-176 AC5 before ADR 0050). */
export const RIDE_MUSIC_OFF_KEY = 'telo-ride.music';

const SOUNDS: readonly Sound[] = ['music', 'none', 'youtube-video', 'youtube-audio'];
const VIDEOS: readonly SoundVideo[] = ['default', 'class'];

/**
 * The rider's sound for a ride in Ibiza as two values in localStorage (L2-185 AC3), read synchronously so the ride
 * opens on it. Nothing kept is Music with the default video; the music kept "off" by the Music toggle reads as No music
 * (AC4). A value it does not know, or storage the browser refuses, counts as never kept (L2-129).
 */
@Injectable()
export class RideSoundStore implements RideSound {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly chosen = signal<Sound>(this.readSound());
  private readonly chosenVideo = signal<SoundVideo>(
    this.read(RIDE_SOUND_VIDEO_KEY, VIDEOS) ?? 'default',
  );

  readonly sound = this.chosen.asReadonly();
  readonly video = this.chosenVideo.asReadonly();

  choose(sound: Sound): void {
    this.chosen.set(sound);
    this.keep(RIDE_SOUND_KEY, sound);
  }

  chooseVideo(video: SoundVideo): void {
    this.chosenVideo.set(video);
    this.keep(RIDE_SOUND_VIDEO_KEY, video);
  }

  private readSound(): Sound {
    const kept = this.read(RIDE_SOUND_KEY, SOUNDS);
    if (kept) return kept;
    try {
      return this.window?.localStorage.getItem(RIDE_MUSIC_OFF_KEY) === 'off' ? 'none' : 'music';
    } catch {
      return 'music';
    }
  }

  private read<T extends string>(key: string, known: readonly T[]): T | null {
    try {
      const raw = this.window?.localStorage.getItem(key);
      return known.find((value) => value === raw) ?? null;
    } catch {
      return null;
    }
  }

  private keep(key: string, value: string): void {
    try {
      this.window?.localStorage.setItem(key, value);
    } catch {
      // Storage refused (private mode, quota): the choice lasts for this ride.
    }
  }
}

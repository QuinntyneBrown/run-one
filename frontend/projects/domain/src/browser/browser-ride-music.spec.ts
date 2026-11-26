// Unit test
// Traces to: L2-176 AC1, AC2, AC4, AC6, AC7
// Description: nothing is made or fetched until the first play; the track loops from its own origin's path; pause
// holds it and the next play carries on; release pauses it, drops its source and forgets it; and a track that cannot
// be loaded or played makes the music unavailable without anything thrown. Whether it plays at all is the rider's
// sound (L2-185), not the music's.
import { TestBed } from '@angular/core/testing';
import { BrowserRideMusic, RIDE_MUSIC_PATH } from './browser-ride-music';

class FakeAudio {
  static made: FakeAudio[] = [];
  static refuse = false;
  loop = false;
  paused = true;
  attributes = new Map<string, string>();
  calls: string[] = [];
  private listeners = new Map<string, () => void>();

  constructor(src: string) {
    this.attributes.set('src', src);
    FakeAudio.made.push(this);
  }
  addEventListener(type: string, listener: () => void): void {
    this.listeners.set(type, listener);
  }
  fail(): void {
    this.listeners.get('error')?.();
  }
  play(): Promise<void> {
    this.calls.push('play');
    if (FakeAudio.refuse) return Promise.reject(new Error('NotAllowedError'));
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.calls.push('pause');
    this.paused = true;
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }
  load(): void {
    this.calls.push('load');
  }
}

describe('BrowserRideMusic', () => {
  const create = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [BrowserRideMusic] });
    return TestBed.inject(BrowserRideMusic);
  };

  beforeEach(() => {
    FakeAudio.made = [];
    FakeAudio.refuse = false;
    vi.stubGlobal('Audio', FakeAudio);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes nothing, and fetches nothing, until the first play (L2-176 AC2)', () => {
    const music = create();
    music.pause();
    music.release();
    expect(FakeAudio.made).toEqual([]);
  });

  it('plays the one track, looping, from the app’s own path (L2-176 AC1, AC2)', () => {
    create().play();
    const [audio] = FakeAudio.made;
    expect(RIDE_MUSIC_PATH).toBe('music/beautiful-boom-bap.mp3');
    expect(audio!.attributes.get('src')).toBe(RIDE_MUSIC_PATH);
    expect(audio!.loop).toBe(true);
    expect(audio!.paused).toBe(false);
  });

  it('holds the track on pause and plays the same element on (L2-176 AC4)', () => {
    const music = create();
    music.play();
    music.pause();
    expect(FakeAudio.made[0]!.paused).toBe(true);
    music.play();
    expect(FakeAudio.made).toHaveLength(1);
    expect(FakeAudio.made[0]!.paused).toBe(false);
  });

  it('pauses, drops the source and forgets the element on release (L2-176 AC6)', () => {
    const music = create();
    music.play();
    music.release();
    const audio = FakeAudio.made[0]!;
    expect(audio.paused).toBe(true);
    expect(audio.attributes.has('src')).toBe(false);
    expect(audio.calls).toContain('load');
    // A second release has nothing to do, and a later play starts a new element.
    music.release();
    expect(audio.calls.filter((call) => call === 'load')).toHaveLength(1);
    music.play();
    expect(FakeAudio.made).toHaveLength(2);
  });

  describe('a track that cannot be played (L2-176 AC7)', () => {
    it('makes the music unavailable when the browser refuses to play, and throws nothing', async () => {
      FakeAudio.refuse = true;
      const music = create();
      expect(() => music.play()).not.toThrow();
      await Promise.resolve();
      await Promise.resolve();
      expect(music.available()).toBe(false);
      expect(() => music.pause()).not.toThrow();
    });

    it('makes the music unavailable when the track cannot be loaded', () => {
      const music = create();
      music.play();
      FakeAudio.made[0]!.fail();
      expect(music.available()).toBe(false);
      // It is not tried again in this ride.
      music.play();
      expect(FakeAudio.made[0]!.calls.filter((call) => call === 'play')).toHaveLength(1);
    });

    it('tries the track again for the next ride', () => {
      const music = create();
      music.play();
      FakeAudio.made[0]!.fail();
      music.release();
      expect(music.available()).toBe(true);
      music.play();
      expect(FakeAudio.made).toHaveLength(2);
    });
  });
});

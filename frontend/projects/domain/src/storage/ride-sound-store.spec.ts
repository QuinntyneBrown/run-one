// Unit test
// Traces to: L2-185 AC3, AC4; L2-129
// Description: the rider's sound and video for a ride in Ibiza in localStorage: Music with the default video until a
// choice is kept, the Music toggle's "off" read as No music, and values it does not know ignored.
import { TestBed } from '@angular/core/testing';
import {
  RIDE_MUSIC_OFF_KEY,
  RIDE_SOUND_KEY,
  RIDE_SOUND_VIDEO_KEY,
  RideSoundStore,
} from './ride-sound-store';

describe('RideSoundStore', () => {
  const store = () => {
    TestBed.configureTestingModule({ providers: [RideSoundStore] });
    return TestBed.inject(RideSoundStore);
  };

  beforeEach(() => localStorage.clear());

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('is Music with the default video when nothing is kept (L2-185 AC4)', () => {
    const sound = store();
    expect(sound.sound()).toBe('music');
    expect(sound.video()).toBe('default');
  });

  it('keeps each choice for the next ride (L2-185 AC3)', () => {
    const sound = store();
    sound.choose('youtube-audio');
    sound.chooseVideo('class');
    expect(localStorage.getItem(RIDE_SOUND_KEY)).toBe('youtube-audio');
    expect(localStorage.getItem(RIDE_SOUND_VIDEO_KEY)).toBe('class');
    TestBed.resetTestingModule();

    const next = store();
    expect(next.sound()).toBe('youtube-audio');
    expect(next.video()).toBe('class');
  });

  it('reads the music kept "off" as No music, unless a sound is kept (L2-185 AC4)', () => {
    localStorage.setItem(RIDE_MUSIC_OFF_KEY, 'off');
    expect(store().sound()).toBe('none');
    TestBed.resetTestingModule();
    localStorage.setItem(RIDE_SOUND_KEY, 'music');
    expect(store().sound()).toBe('music');
  });

  it('ignores values it does not know (L2-129)', () => {
    localStorage.setItem(RIDE_SOUND_KEY, '<b>loud</b>');
    localStorage.setItem(RIDE_SOUND_VIDEO_KEY, 'xfgZRgPkoME');
    const sound = store();
    expect(sound.sound()).toBe('music');
    expect(sound.video()).toBe('default');
  });

  it('chooses for this ride when storage refuses', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const sound = store();
    sound.choose('none');
    expect(sound.sound()).toBe('none');
  });
});

// Unit test
// Traces to: L2-088 AC4; L2-131 AC1
// Description: a class video that has not played for 10 s of the ride cannot play, whatever it is doing instead; one
// that plays, or has been short of playing for less, can. One case per row.
import { VIDEO_STALL_SECONDS, VideoStallWatch } from './video-stall-watch';
import type { PlayerState } from '@telo/api';

describe('VideoStallWatch', () => {
  it('counts 10 s', () => {
    expect(VIDEO_STALL_SECONDS).toBe(10);
  });

  const rows: readonly {
    readonly name: string;
    readonly seen: readonly (readonly [PlayerState, number])[];
    readonly stalled: boolean;
  }[] = [
    {
      name: 'a video that plays',
      seen: [
        ['playing', 1],
        ['playing', 30],
      ],
      stalled: false,
    },
    {
      name: 'a video still loading 9 s on',
      seen: [
        ['loading', 1],
        ['loading', 10],
      ],
      stalled: false,
    },
    {
      name: 'a video still loading 10 s on',
      seen: [
        ['loading', 1],
        ['loading', 11],
      ],
      stalled: true,
    },
    {
      name: 'a video buffering for 9 s',
      seen: [
        ['playing', 5],
        ['buffering', 6],
        ['buffering', 15],
      ],
      stalled: false,
    },
    {
      name: 'a video buffering for 10 s',
      seen: [
        ['playing', 5],
        ['buffering', 6],
        ['buffering', 16],
      ],
      stalled: true,
    },
    {
      name: 'a video paused on its own for 10 s of the ride',
      seen: [
        ['paused', 100],
        ['paused', 110],
      ],
      stalled: true,
    },
    {
      name: 'a video that buffers, plays and buffers again, 10 s from the first',
      seen: [
        ['buffering', 1],
        ['playing', 8],
        ['buffering', 9],
        ['buffering', 11],
      ],
      stalled: false,
    },
    {
      name: 'a video that plays again after it stalled',
      seen: [
        ['buffering', 1],
        ['buffering', 20],
        ['playing', 21],
      ],
      stalled: false,
    },
    {
      name: 'a ride held for a minute, whose second stands still',
      seen: [
        ['paused', 40],
        ['paused', 40],
        ['paused', 41],
      ],
      stalled: false,
    },
    {
      name: 'a hidden tab that skips a minute while the video buffers',
      seen: [
        ['buffering', 1],
        ['buffering', 61],
      ],
      stalled: true,
    },
  ];

  for (const row of rows)
    it(`${row.name}: ${row.stalled ? 'cannot play' : 'is given time'}`, () => {
      const watch = new VideoStallWatch();
      let stalled = false;
      for (const [state, second] of row.seen) stalled = watch.check(state, second);
      expect(stalled).toBe(row.stalled);
    });

  // Traces to: L2-186 AC6
  it('starts its count again for a new player', () => {
    const watch = new VideoStallWatch();
    watch.check('loading', 0);
    watch.reset();
    expect(watch.check('loading', 12)).toBe(false);
    expect(watch.check('loading', 22)).toBe(true);
  });
});

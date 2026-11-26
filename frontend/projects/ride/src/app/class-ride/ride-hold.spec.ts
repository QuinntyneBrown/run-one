// Unit test
// Traces to: L2-091 AC1, AC3; L2-092 AC1, AC2, AC4; L2-180 AC6, AC7; L2-181 AC5
// Description: the state of a class ride from the two reasons it can be held, one case per row: running, paused by
// the rider, held for a lost bike, and both. Then the alert's words with the class video and in Ibiza, and what a
// screen reader hears on Pause and on Resume.
import { lostBikeMessage, pauseAnnouncement, rideHeader, rideHold } from './ride-hold';

describe('rideHold', () => {
  it.each([
    {
      state: 'running',
      pausedByRider: false,
      bikeLost: false,
      expected: {
        running: true,
        action: 'Pause',
        actionDisabled: false,
        pausedOverlay: false,
        lostAlert: false,
      },
    },
    {
      state: 'paused by the rider',
      pausedByRider: true,
      bikeLost: false,
      expected: {
        running: false,
        action: 'Resume',
        actionDisabled: false,
        pausedOverlay: true,
        lostAlert: false,
      },
    },
    {
      state: 'held for a lost bike',
      pausedByRider: false,
      bikeLost: true,
      expected: {
        running: false,
        action: 'Resume',
        actionDisabled: true,
        pausedOverlay: false,
        lostAlert: true,
      },
    },
    {
      state: 'paused by the rider, then the bike lost',
      pausedByRider: true,
      bikeLost: true,
      expected: {
        running: false,
        action: 'Resume',
        actionDisabled: true,
        pausedOverlay: true,
        lostAlert: true,
      },
    },
  ] as const)('$state', ({ pausedByRider, bikeLost, expected }) => {
    expect(rideHold({ pausedByRider, bikeLost })).toEqual(expected);
  });

  it('a ride the rider paused is still paused once the bike is back (L2-092 AC4)', () => {
    const back = rideHold({ pausedByRider: true, bikeLost: false });

    expect(back.running).toBe(false);
    expect(back.actionDisabled).toBe(false);
  });
});

describe('rideHeader', () => {
  it.each([
    ['waiting', false, true],
    ['countdown', false, true],
    ['riding', true, true],
    ['finished', false, false],
    ['rolling-out', false, false],
  ] as const)('in %s Pause shows: %s, Leave shows: %s', (phase, pause, leave) => {
    expect(rideHeader(phase)).toEqual({ pause, leave });
  });
});

describe('lostBikeMessage', () => {
  it('says the class has not started when the bike is lost during the countdown, in either way (L2-180 AC7)', () => {
    const words = 'The class has not started. Pedal to wake the bike, then reconnect.';
    expect(lostBikeMessage('video', 'countdown')).toBe(words);
    expect(lostBikeMessage('ibiza', 'countdown')).toBe(words);
  });

  it('says the video is paused with the class video (L2-092 AC1)', () => {
    expect(lostBikeMessage('video')).toBe(
      'The video is paused. Pedal to wake the bike, then reconnect.',
    );
  });

  it('says the ride is paused in Ibiza, where there is no video to pause (L2-092 AC1)', () => {
    expect(lostBikeMessage('ibiza')).toBe(
      'The ride is paused. Pedal to wake the bike, then reconnect.',
    );
  });
});

describe('pauseAnnouncement', () => {
  it('says the ride is paused, and that it is resumed (L2-091 AC3)', () => {
    expect(pauseAnnouncement(true)).toBe('Ride paused');
    expect(pauseAnnouncement(false)).toBe('Ride resumed');
  });
});

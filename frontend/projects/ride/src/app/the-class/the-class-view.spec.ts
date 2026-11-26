// Unit test
// Traces to: L2-084 AC1, AC4, AC6, AC7; L2-173 AC1, AC3, AC5, AC6; L2-010 AC1
// Description: The Class's view. The start button reads "Start class" and opens the ride with a connected bike, and
// "Connect your bike" with its line, opening Connect Bike, without one, whichever way the class is ridden. "Ride with"
// offers the class video and Ibiza Sunset Strip, which says how far and how high it is, or why it cannot be chosen.
// The class's words come from its definition, and the course's still stands in when the ride is in Ibiza.
import { INTERVALS_TO_THE_BEAT } from '@telo/domain';
import type { Segment, SegmentKind } from '@telo/api';
import { rideWithOptions, startAction, theClassView, whatTheBikeWillDo } from './the-class-view';

const seg = (kind: SegmentKind, duration: number, level: number, cadenceAim: number): Segment => ({
  kind,
  duration,
  level,
  cadenceAim,
});

const state = {
  definition: INTERVALS_TO_THE_BEAT,
  connected: true,
  blocked: false,
  rideWith: 'video',
  drawable: true,
  videoUnavailable: false,
  record: { rides: 0, bestKj: null, lastKj: null },
} as const;

const returning = { rides: 6, bestKj: 342, lastKj: 318 } as const;

describe('startAction', () => {
  it.each([
    { connected: true, label: 'Start class', hint: null, opens: 'ride', disabled: false },
    {
      connected: false,
      label: 'Connect your bike',
      hint: 'The class needs the bike to set resistance.',
      opens: 'connect',
      disabled: false,
    },
  ] as const)('connected $connected: "$label" opens $opens', ({ connected, ...action }) => {
    expect(startAction(connected, false)).toEqual(action);
  });

  it('in a blocked browser reads "Connect your bike" with its line, and is disabled (L2-010 AC1)', () => {
    expect(startAction(false, true)).toEqual({
      label: 'Connect your bike',
      hint: 'The class needs the bike to set resistance.',
      opens: 'connect',
      disabled: true,
    });
    expect(theClassView({ ...state, connected: false, blocked: true }).start).toEqual(
      startAction(false, true),
    );
  });

  it.each(['video', 'ibiza'] as const)('reads the same when the ride is with %s', (rideWith) => {
    expect(theClassView({ ...state, rideWith }).start).toEqual(startAction(true, false));
    expect(theClassView({ ...state, rideWith, connected: false }).start).toEqual(
      startAction(false, false),
    );
  });
});

describe('the record and "Ride it again" (L2-084 AC5, AC8)', () => {
  it('reads "Ride it again" with a connected bike once a ride is finished (AC5)', () => {
    expect(startAction(true, false, true)).toEqual({
      label: 'Ride it again',
      hint: null,
      opens: 'ride',
      disabled: false,
    });
    expect(theClassView({ ...state, record: returning }).start.label).toBe('Ride it again');
  });

  it('still reads "Connect your bike" without a bike, whatever the record says (AC6)', () => {
    expect(startAction(false, false, true)).toEqual(startAction(false, false));
    expect(theClassView({ ...state, connected: false, record: returning }).start.label).toBe(
      'Connect your bike',
    );
  });

  it('reads Rides, Best output and Last time for a returning rider (AC8)', () => {
    expect(theClassView({ ...state, record: returning }).record).toEqual({
      rides: '6',
      best: '342 kJ',
      last: '318 kJ',
    });
  });

  it('shows none of the three, and reads "Start class", to a rider with no finished ride (AC4, AC8)', () => {
    const view = theClassView(state);
    expect(view.record).toBeNull();
    expect(view.start.label).toBe('Start class');
  });

  it('shows a best and a last of 0 kJ for a ride of no output', () => {
    expect(theClassView({ ...state, record: { rides: 1, bestKj: 0, lastKj: 0 } }).record).toEqual({
      rides: '1',
      best: '0 kJ',
      last: '0 kJ',
    });
  });
});

describe('rideWithOptions', () => {
  it('offers the class video and Ibiza Sunset Strip with its length and climb', () => {
    expect(rideWithOptions(true)).toEqual([
      { way: 'video', name: 'Class video', detail: null, disabled: false },
      {
        way: 'ibiza',
        name: 'Ibiza Sunset Strip',
        detail: '8.4 km · 159 m of climbing',
        disabled: false,
      },
    ]);
  });

  it('disables Ibiza and says why where the browser cannot draw it', () => {
    expect(rideWithOptions(false)[1]).toEqual({
      way: 'ibiza',
      name: 'Ibiza Sunset Strip',
      detail: 'This browser can’t draw Ibiza.',
      disabled: true,
    });
    expect(rideWithOptions(false)[0].disabled).toBe(false);
  });
});

describe('whatTheBikeWillDo', () => {
  it('reads the average, the plan and the efforts of Intervals to the Beat (L2-084 AC2, AC3)', () => {
    const { segments } = INTERVALS_TO_THE_BEAT.plan;
    expect(whatTheBikeWillDo(segments)).toEqual({
      average: '~254 W average',
      segments,
      note: '17 efforts · 0:15 to 1:15. Resistance changes on its own; you just pedal.',
    });
    expect(theClassView(state).plan).toEqual(whatTheBikeWillDo(segments));
  });

  it.each([
    [
      'efforts of one length',
      [seg('work', 30, 24, 100), seg('recover', 90, 6, 72), seg('work', 30, 24, 100)],
      '~235 W average',
      '2 efforts · 0:30. Resistance changes on its own; you just pedal.',
    ],
    [
      'one effort',
      [seg('warm-up', 300, 8, 80), seg('work', 360, 12, 90)],
      '~183 W average',
      '1 effort · 6:00. Resistance changes on its own; you just pedal.',
    ],
    [
      'no effort',
      [seg('steady', 1800, 12, 85)],
      '~205 W average',
      'Resistance changes on its own; you just pedal.',
    ],
  ])('reads a plan with %s from the plan', (_, segments, average, note) => {
    expect(whatTheBikeWillDo(segments)).toMatchObject({ average, note });
  });
});

describe('theClassView', () => {
  it('reads the class’s words and its length from its definition', () => {
    expect(theClassView(state)).toMatchObject({
      meta: 'GCN Training · Intervals',
      title: 'Intervals to the Beat',
      summary:
        'Seventeen efforts from 15 seconds to 1:15, ridden to the beat, with five fast sprints to finish.',
      length: '20:00',
      lengthLabel: 'start to finish',
      cover: {
        url: 'https://i.ytimg.com/vi/il_OFz6o42I/hqdefault.jpg',
        alt: 'Video: Intervals to the Beat, GCN Training',
      },
    });
  });

  it('has no still with the class video, and the course’s still in Ibiza', () => {
    expect(theClassView(state).still).toBeNull();
    expect(theClassView({ ...state, rideWith: 'ibiza' }).still).toEqual({
      url: 'courses/ibiza-sunset-strip.jpg',
      alt: 'Ibiza Sunset Strip: a seafront road at sunset',
    });
  });

  it('says when the video cannot load', () => {
    expect(theClassView(state).videoUnavailable).toBe(false);
    expect(theClassView({ ...state, videoUnavailable: true }).videoUnavailable).toBe(true);
  });
});

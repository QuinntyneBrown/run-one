import type {
  ClassDefinition,
  RideRecordSnapshot,
  RideWith,
  RideWithOption,
  Segment,
  StartAction,
  TheClassView,
  WhatTheBikeWillDo,
} from '@telo/api';
import { formatClock } from '@telo/components';
import { PlanSummary } from '@telo/domain';
import { IBIZA_SUNSET_STRIP as IBIZA } from '../classes/ibiza-sunset-strip';

/** What The Class is drawn from. */
export interface TheClassState {
  readonly definition: ClassDefinition;
  /** The bike is connected (`ble` is `connected`). */
  readonly connected: boolean;
  /** The browser is blocked: it cannot reach a bike (`isBlocked`). */
  readonly blocked: boolean;
  /** How the class will be ridden (`rideWith`). */
  readonly rideWith: RideWith;
  /** The browser can draw the course. */
  readonly drawable: boolean;
  readonly videoUnavailable: boolean;
  /** What the rider has finished on this device. */
  readonly record: RideRecordSnapshot;
}

/**
 * The start button (L2-084 AC4, AC6, AC7): "Start class" opens the ride with a connected bike; without one it reads
 * "Connect your bike", says why, and opens Connect Bike. Its words never follow the choice of how to ride (L2-173 AC5).
 * In a blocked browser no bike can be connected, so the button is disabled and keeps its words and its line (L2-010
 * AC1). With a connected bike and a finished ride it reads "Ride it again" (L2-084 AC5).
 */
export function startAction(connected: boolean, blocked: boolean, returning = false): StartAction {
  return connected
    ? {
        label: returning ? 'Ride it again' : 'Start class',
        hint: null,
        opens: 'ride',
        disabled: false,
      }
    : {
        label: 'Connect your bike',
        hint: 'The class needs the bike to set resistance.',
        opens: 'connect',
        disabled: blocked,
      };
}

/** The two options of "Ride with" (L2-173 AC1, AC3, AC6): Ibiza says how far and how high, or why it cannot be chosen. */
export function rideWithOptions(drawable: boolean): readonly RideWithOption[] {
  return [
    { way: 'video', name: 'Class video', detail: null, disabled: false },
    {
      way: 'ibiza',
      name: IBIZA.name,
      detail: drawable ? IBIZA.facts : IBIZA.cannotDraw,
      disabled: !drawable,
    },
  ];
}

/** The line under the resistance profile, whatever the plan (L2-084 AC2). */
const JUST_PEDAL = 'Resistance changes on its own; you just pedal.';

/**
 * "What the bike will do" (L2-084 AC2, AC3): "~254 W average", the plan's time-weighted target power, rounded; the
 * segments the resistance profile is drawn from; and "17 efforts · 0:15 to 1:15. Resistance changes on its own; you
 * just pedal.", the efforts counted and their shortest and longest lengths read from the plan. Efforts of one length
 * read that length once, and a plan with no effort only the sentence.
 */
export function whatTheBikeWillDo(segments: readonly Segment[]): WhatTheBikeWillDo {
  const { count, shortest, longest } = PlanSummary.efforts(segments);
  const lengths =
    shortest === longest
      ? formatClock(shortest)
      : `${formatClock(shortest)} to ${formatClock(longest)}`;
  return {
    average: `~${PlanSummary.averagePower(segments)} W average`,
    segments,
    note:
      count === 0
        ? JUST_PEDAL
        : `${count} ${count === 1 ? 'effort' : 'efforts'} · ${lengths}. ${JUST_PEDAL}`,
  };
}

/** The record a returning rider sees (L2-084 AC8): the ride count, the best and the last output in whole kJ. */
function recordView(record: RideRecordSnapshot): TheClassView['record'] {
  if (record.rides === 0) return null;
  return {
    rides: String(record.rides),
    best: `${record.bestKj ?? 0} kJ`,
    last: `${record.lastKj ?? 0} kJ`,
  };
}

/** The Class as it is drawn (L2-084 AC1 to AC3, L2-173). */
export function theClassView(state: TheClassState): TheClassView {
  const { definition } = state;
  return {
    meta: `${definition.channel} · ${definition.focus}`,
    title: definition.title,
    summary: definition.summary,
    length: formatClock(definition.lengthSeconds),
    lengthLabel: 'start to finish',
    // YouTube's 4:3 cover, cropped to its 16:9 picture (ADR 0014).
    cover: {
      url: `https://i.ytimg.com/vi/${encodeURIComponent(definition.video.videoId)}/hqdefault.jpg`,
      alt: `Video: ${definition.title}, ${definition.channel}`,
    },
    still: state.rideWith === 'ibiza' ? IBIZA.still : null,
    videoUnavailable: state.videoUnavailable,
    rideWith: state.rideWith,
    options: rideWithOptions(state.drawable),
    start: startAction(state.connected, state.blocked, state.record.rides > 0),
    record: recordView(state.record),
    plan: whatTheBikeWillDo(definition.plan.segments),
  };
}

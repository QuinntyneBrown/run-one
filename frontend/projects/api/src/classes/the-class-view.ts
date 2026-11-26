import type { Segment } from '../workout/plan';
import type { RideWith } from './how-to-ride';

/** The start button of The Class: its words, the line under it, and the screen it opens (L2-084 AC4, AC6, AC7). */
export interface StartAction {
  readonly label: string;
  readonly hint: string | null;
  readonly opens: 'ride' | 'connect';
  /** The button cannot be pressed: the browser is blocked, and no ride starts there (L2-010 AC1). */
  readonly disabled: boolean;
}

/** One option of "Ride with" (L2-173): its name, the line under it, and whether it can be chosen. */
export interface RideWithOption {
  readonly way: RideWith;
  readonly name: string;
  readonly detail: string | null;
  readonly disabled: boolean;
}

/** A picture with its text alternative. */
export interface Picture {
  readonly url: string;
  readonly alt: string;
}

/**
 * "What the bike will do" on The Class (L2-084 AC2): the plan's average target power in words, the segments its
 * resistance profile is drawn from, and the line under the profile.
 */
export interface WhatTheBikeWillDo {
  /** "~254 W average". */
  readonly average: string;
  readonly segments: readonly Segment[];
  /** "17 efforts · 0:15 to 1:15. Resistance changes on its own; you just pedal." */
  readonly note: string;
}

/** The Class as it is drawn (L2-084, L2-173): what the page hands the `the-class` block. */
export interface TheClassView {
  /** "GCN Training · Intervals". */
  readonly meta: string;
  readonly title: string;
  readonly summary: string;
  /** "20:00", with "start to finish" beside it. */
  readonly length: string;
  readonly lengthLabel: string;
  /** The class cover, under the video player. */
  readonly cover: Picture;
  /** The course's still, in the video's box when the rider has chosen Ibiza; `null` with the class video. */
  readonly still: Picture | null;
  /** The video cannot load: the cover stands alone, with no player over it (L2-084 AC9). */
  readonly videoUnavailable: boolean;
  readonly rideWith: RideWith;
  readonly options: readonly RideWithOption[];
  readonly start: StartAction;
  /** "Rides", "Best output" and "Last time" for a returning rider; `null` for one with no finished ride (L2-084 AC8). */
  readonly record: { readonly rides: string; readonly best: string; readonly last: string } | null;
  readonly plan: WhatTheBikeWillDo;
}

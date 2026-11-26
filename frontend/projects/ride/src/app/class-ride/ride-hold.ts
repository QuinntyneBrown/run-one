import type { RidePhase } from './ride-phase';

/** Why a class ride stands still: the rider paused it, the bike stopped answering, both, or neither. */
export interface RideHoldReasons {
  /** The rider pressed Pause and has not pressed Resume (L2-091). */
  readonly pausedByRider: boolean;
  /** The bike has stopped answering and is not back (L2-092). */
  readonly bikeLost: boolean;
}

/** What Class Ride does and shows in one of the four states a ride can be in. */
export interface RideHold {
  /** Whether the clock, the plan and the video (or the course) run. */
  readonly running: boolean;
  /** The header button's word: "Pause" while the ride runs, "Resume" while it is held. */
  readonly action: 'Pause' | 'Resume';
  /** Whether that button is disabled: only the bike coming back ends a hold for a lost bike. */
  readonly actionDisabled: boolean;
  /** Whether "Paused" is drawn over the video or the course: the rider's own pause. */
  readonly pausedOverlay: boolean;
  /** Whether the "Lost the bike" alert shows, with Reconnect. */
  readonly lostAlert: boolean;
}

/**
 * The state of a class ride from the two reasons it can be held (L2-091 AC1, L2-092 AC1, AC2, AC4;
 * docs/mocks/pages/class-ride/default, paused and disconnected). The ride runs only with neither; a lost bike turns
 * Resume off and shows the alert, which says the ride is paused, so "Paused" is drawn for the rider's own pause
 * alone; and a ride the rider paused stays paused when the bike is back.
 */
export function rideHold({ pausedByRider, bikeLost }: RideHoldReasons): RideHold {
  const running = !pausedByRider && !bikeLost;
  return {
    running,
    action: running ? 'Pause' : 'Resume',
    actionDisabled: bikeLost,
    pausedOverlay: pausedByRider,
    lostAlert: bikeLost,
  };
}

/** Which of the header's buttons show in a phase of the ride (L2-180 AC6, L2-181 AC5). */
export interface RideHeader {
  /** Pause or Resume: only while the ride runs, so not during the countdown or the ending. */
  readonly pause: boolean;
  /** Leave: not once the ride is finished, when its result is already kept. */
  readonly leave: boolean;
}

/**
 * The header's buttons by phase: no ride, so no Pause, during the countdown; Pause and Leave while it runs; neither
 * once it is finished. Full screen is always there and is not this function's.
 */
export function rideHeader(phase: RidePhase): RideHeader {
  return {
    pause: phase === 'riding',
    leave: phase !== 'finished' && phase !== 'rolling-out',
  };
}

/**
 * What the lost-bike alert says the ride is doing meanwhile: the video with the class video, the ride in Ibiza
 * (L2-092 AC1), or, in the countdown, that the class has not started (L2-180 AC7).
 */
export function lostBikeMessage(ridingIn: 'video' | 'ibiza', phase: RidePhase = 'riding'): string {
  if (phase === 'countdown')
    return 'The class has not started. Pedal to wake the bike, then reconnect.';
  return ridingIn === 'ibiza'
    ? 'The ride is paused. Pedal to wake the bike, then reconnect.'
    : 'The video is paused. Pedal to wake the bike, then reconnect.';
}

/** The roll-out card's title: the promenade in Ibiza, plain "Rolling on" with the class video (L2-182 AC4). */
export function rollOutTitle(ridingIn: 'video' | 'ibiza'): string {
  return ridingIn === 'ibiza' ? 'Rolling on down the promenade' : 'Rolling on';
}

/** What a screen reader hears when the rider pauses or resumes the ride, once for each change (L2-091 AC3). */
export function pauseAnnouncement(paused: boolean): string {
  return paused ? 'Ride paused' : 'Ride resumed';
}

import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  ANNOUNCER,
  BIKE_CONNECTION,
  COURSE_GRAPHICS,
  type ClassDefinition,
  DIAGNOSTIC_RECORDING,
  type ClassResult,
  HOW_TO_RIDE,
  INTENSITY_DEFAULT,
  RIDE_ACTIVITY,
  RIDE_MUSIC,
  RIDE_SOUND,
  RIDE_RECORD,
  SCREEN_WAKE_LOCK,
  type Sound,
  type SoundVideo,
  THE_CLASS,
  TICKER,
  VIDEO_PLAYER_FACTORY,
  type VideoPlayer,
} from '@telo/api';
import {
  BikeTelemetry,
  Countdown,
  ResistanceEaseOff,
  RideEnding,
  type PlanState,
  PowerModel,
  ResistanceController,
  RideClock,
  RideIntensity,
  EffortTally,
  RideRecorder,
  RideTicker,
  VideoClockSync,
  VideoStallWatch,
  WorkoutEngine,
  rideWith,
} from '@telo/domain';
import { classStepAnnouncement } from '../rides/step-announcement';
import {
  lostBikeMessage,
  pauseAnnouncement,
  rideHeader,
  rideHold,
  rollOutTitle,
} from './ride-hold';
import type { RidePhase } from './ride-phase';
import { type StatView, cadenceStat, powerStat } from './stat-view';

/** The video a YouTube sound plays in Ibiza unless the rider chose the class's own (L2-186, ADR 0050). */
export const DEFAULT_VIDEO: YouTubeSource = {
  videoId: 'xfgZRgPkoME',
  syncOffsetSeconds: 0,
  title: 'Default video',
};

/** A video the ride plays, and the video time at which the ride's 0:00 stands. */
interface YouTubeSource {
  readonly videoId: string;
  readonly syncOffsetSeconds: number;
  readonly title: string;
}

/**
 * The solo class ride's state (docs/detailed-designs/class-ride/ride-the-class), provided by the page so it goes when the
 * rider leaves. It reads the class from `THE_CLASS` and how the rider chose to ride it. The engine follows the plan
 * as soon as the store exists, which sends the first segment's level, so the bike is set before the countdown (L2-027,
 * L2-175 AC1, L2-180 AC3); the ride then waits, and the page begins the countdown when Class Ride takes the screen.
 * The clock and the ticker start as "Go!" shows, at the instant it was due (L2-180 AC2, AC5). In Ibiza no video player is loaded (L2-174 AC1), and the course's box loads until its first frame is
 * drawn. The header and the segment card read
 * the ticker's whole seconds (L2-134 AC2); Power and Cadence read the bike's telemetry as it arrives (AC1). The class
 * video plays from the ride clock plus the class's sync offset (L2-088 AC1) and, on each tick, seeks back when it has
 * drifted more than 1.5 s (AC2); when it cannot play, or has not played for 10 s of the ride, the ride carries on
 * without it and the notice says so (AC4). A bike that refuses control is set by hand, and is sent nothing (L2-014 AC3). The rider pauses and
 * resumes it (docs/detailed-designs/class-ride/pause-leave-or-finish-the-class, L2-091), each said once to a screen
 * reader; a lost bike holds it until the bike is back, when the segment's level is sent again
 * (docs/detailed-designs/class-ride/wait-for-a-lost-bike, L2-092); the screen stays awake while it runs (L2-133 AC3);
 * and at the class length it opens Class Done. Once the rider leaves or the ride finishes, the connection forgets the
 * ride's target, so no resistance command follows it (L2-093 AC3).
 */
@Injectable()
export class ClassRideStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly resistance = inject(ResistanceController);
  private readonly rideIntensity = inject(RideIntensity);
  private readonly telemetry = inject(BikeTelemetry);
  private readonly loaded = signal<ClassDefinition | null>(null);
  private readonly sync = inject(VideoClockSync);
  private readonly stall = inject(VideoStallWatch);
  private readonly stalled = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private readonly player = signal<VideoPlayer | null>(null);
  private readonly playerMissing = signal(false);
  private readonly pausedByRider = signal(false);
  private readonly pausedByBike = signal(false);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly beat = inject(TICKER);
  private readonly router = inject(Router);
  private readonly announcer = inject(ANNOUNCER);
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  private readonly music = inject(RIDE_MUSIC);
  private readonly soundChoice = inject(RIDE_SOUND);
  private readonly rideRecord = inject(RIDE_RECORD);
  private readonly countdownTimer = inject(Countdown);
  private readonly ending = inject(RideEnding);
  private readonly easeOff = inject(ResistanceEaseOff);
  /** What the finish banner shows: the output Class Done will show, in whole kJ, and the ride's time (L2-181 AC2). */
  private readonly result = signal<{ outputKj: number; elapsedSeconds: number } | null>(null);
  /** The ride's result, kept until the ending is over and Class Done opens with it. */
  private classResult: ClassResult | null = null;
  /** Whether a ride is in progress, so a new version of the app waits for its end (L2-150 AC2). */
  private readonly activity = inject(RIDE_ACTIVITY);
  private readonly stage = signal<RidePhase>('waiting');
  /** The ride's output and share on target, for Class Done. */
  private recorder: RideRecorder | null = null;
  /** The watts of each effort, a sum for each work segment of the plan (L2-169). */
  private efforts: EffortTally | null = null;
  private lastSecond = 0;
  private videoHost: HTMLElement | null = null;
  /** The YouTube inset's element in Ibiza, while one is drawn (L2-186 AC1). */
  private insetHost: HTMLElement | null = null;
  /** The video the inset's player was made for, so a change of video loads the other (L2-186 AC5). */
  private insetVideo: string | null = null;
  /** Counts players asked for: one that arrives after the rider changed their mind is destroyed at once. */
  private playerAsked = 0;
  private destroyed = false;

  /**
   * How the ride is ridden, as the rider chose on The Class (L2-173 AC5): with the class video, or in Ibiza. A browser
   * that cannot draw the course rides with the class video (AC6).
   */
  readonly way = rideWith(inject(HOW_TO_RIDE).kept(), inject(COURSE_GRAPHICS).available());
  /** What the lost-bike alert says is paused: the video, or in Ibiza the ride (L2-092 AC1). */
  readonly lostBody = computed(() => lostBikeMessage(this.way, this.stage()));
  /** The stage the ride is in: waiting, the countdown, riding, finished or rolling out (ADR 0049). */
  readonly phase = this.stage.asReadonly();
  /** What the countdown shows, or `null` when it is not on the screen (L2-180 AC1). */
  readonly countdown = this.countdownTimer.step;
  /** Which of Pause and Leave the header shows in this phase (L2-180 AC6). */
  readonly header = computed(() => rideHeader(this.stage()));
  private readonly courseShown = signal(false);
  /** Whether the course's first frame has been drawn; until then its box reads "Loading …" (L2-175 AC1). */
  readonly courseDrawn = this.courseShown.asReadonly();
  private readonly courseFailed = signal(false);
  /** Whether the course cannot be drawn: its still stays and a notice says so (L2-175 AC2). */
  readonly courseUnavailable = this.courseFailed.asReadonly();
  readonly ride = this.loaded.asReadonly();
  readonly elapsed = this.ticker.second;
  /**
   * Where the plan stands. At the plan's end the engine has none; through the ending the card holds the cool-down at
   * 0:00 with its bar full (L2-181 AC4).
   */
  readonly plan = computed<PlanState | null>(() => {
    const state = this.engine.state();
    const ride = this.loaded();
    if (state || !ride || (this.stage() !== 'finished' && this.stage() !== 'rolling-out'))
      return state;
    const segments = ride.plan.segments;
    const segment = segments[segments.length - 1];
    return {
      index: segments.length - 1,
      segment,
      remainingMs: 0,
      progress: 1,
      targetPower: PowerModel.target(segment.cadenceAim, segment.level),
    };
  });
  /** Whether the ride is over and its ending shows: no line stands under Power or Cadence then (L2-181 AC4). */
  private readonly ended = computed(
    () => this.stage() === 'finished' || this.stage() === 'rolling-out',
  );
  /** Whether the stepper is off: the bike cannot be controlled, or the ride is over and the bike eases off (L2-182 AC2). */
  readonly stepperOff = computed(() => !this.canControl() || this.ended());
  /** The roll-out card's figures while it shows, otherwise `null` (L2-182 AC4). */
  readonly rollOut = computed(() => {
    if (this.stage() !== 'rolling-out') return null;
    return { title: rollOutTitle(this.way), progress: this.ending.state()?.rollOutShare ?? 0 };
  });
  /**
   * The seconds that place the rider on the course: the ride clock's, and through the ending the class length plus the
   * whole seconds since the finish, so the rider rolls on past the finish line (L2-174 AC7).
   */
  readonly courseSeconds = computed(() => {
    const ending = this.ending.state();
    const length = this.loaded()?.lengthSeconds ?? 0;
    return this.ended() && ending
      ? length + Math.floor(ending.elapsedMs / 1000)
      : this.ticker.second();
  });
  /** The finish banner's figures while it shows, otherwise `null` (L2-181 AC1). */
  readonly finished = computed(() => (this.stage() === 'finished' ? this.result() : null));
  readonly level = this.telemetry.resistance;
  readonly canControl = this.resistance.canControl;
  /** Whether the bike refused control of its resistance, so the rider sets it by hand (L2-014 AC3). */
  readonly byHand = this.resistance.byHand;
  /** Whether the rider paused the ride: the clock, the plan and the video hold (L2-091 AC1). */
  readonly paused = this.pausedByRider.asReadonly();
  /** Whether the bike has stopped answering (`ble` disconnected, L2-017); the ride waits for it (L2-092 AC4). */
  readonly bikeLost = computed(() => this.connection.ble() === 'disconnected');
  /** Which of its four states the ride is in, and what the screen shows for it (L2-091, L2-092). */
  readonly state = computed(() =>
    rideHold({
      pausedByRider: this.pausedByRider(),
      // The ending waits for no bike: a lost one shows no alert and holds nothing (L2-182 AC8).
      bikeLost: this.bikeLost() && !this.ended(),
    }),
  );
  /** Whether the ride runs: past "Go!", and held neither by the rider nor by a lost bike; the course moves while it does. */
  readonly running = computed(
    () => (this.stage() === 'riding' && this.state().running) || this.ended(),
  );
  /** The bike's speed, which turns the pedals of the course's rider; the clock places them (L2-174 AC2). */
  readonly speedKmh = this.telemetry.speedKmh;
  /**
   * Whether the video cannot play: its code or YouTube's did not load, the player failed, or it has not played for
   * 10 s of the ride, as with no network (L2-088 AC4). A video that plays again can.
   */
  readonly videoUnavailable = computed(
    () => this.playerMissing() || this.player()?.state() === 'error' || this.stalled(),
  );

  /** Power against the segment's target power: "On target" within 10 %, otherwise the signed difference (L2-089 AC2). */
  readonly power = computed<StatView>(() =>
    // Until the clock starts nothing is on or off target, so no line stands under Power (L2-180 AC3).
    powerStat(
      this.telemetry.powerW(),
      this.stage() === 'riding' ? (this.plan()?.targetPower ?? null) : null,
    ),
  );

  /** Cadence with the segment's aim (L2-089 AC3). */
  readonly cadence = computed<StatView>(() =>
    cadenceStat(this.telemetry.cadence(), this.ended() ? null : this.plan()?.segment.cadenceAim),
  );

  constructor() {
    // Each segment, said once as it starts, in the segment card's words (L2-141 AC2).
    const announcer = this.announcer;
    const step = computed(() => this.engine.state()?.index ?? null);
    effect(() => {
      if (step() === null) return;
      const segment = untracked(() => this.engine.state()?.segment);
      if (segment) announcer.announce(classStepAnnouncement(segment));
    });
    // The music plays through a ride in Ibiza while the sound is Music, and holds with it, as the course does (L2-176
    // AC1, AC4, L2-185); a ride with the class video has its own sound and no music (AC3).
    if (this.way === 'ibiza') {
      // The inset's player follows the rider's choice of YouTube video, or goes with it (L2-186 AC5).
      const video = computed(() => this.youtube()?.videoId ?? null);
      effect(() => {
        video();
        untracked(() => this.followYouTube());
      });
      effect(() =>
        this.running() && this.soundChoice.sound() === 'music'
          ? this.music.play()
          : this.music.pause(),
      );
    }
    // With a diagnostic recording on, the readouts the rider sees go into it as they change (L2-178 AC8). The
    // recording is bound only when the app is opened with `?diagnose`; for a rider this is `null` and nothing runs.
    const recording = inject(DIAGNOSTIC_RECORDING, { optional: true });
    if (recording) {
      const shown = (level: number | null): string => (level === null ? '—' : String(level));
      effect(() =>
        recording.readouts({
          power: this.power().value,
          cadence: this.cadence().value,
          resistance: shown(this.level()),
          targetResistance: shown(this.resistance.target()),
        }),
      );
    }
    // The ride opens at the rider's default intensity, before the plan's first level is sent (L2-183 AC2).
    this.rideIntensity.start(inject(INTENSITY_DEFAULT).kept());
    this.start(inject(THE_CLASS).get());
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      // The connection outlives the ride: it must not send this ride's level after a later reconnect (L2-093 AC3).
      this.connection.forgetTarget();
      this.player()?.destroy();
      // The lock is bound on the route, whose injector outlives the page.
      this.wakeLock.release();
      this.music.release();
      this.activity.end();
    });
  }

  /** The rider's sound in Ibiza and the video a YouTube sound plays, kept on the device (L2-185). */
  readonly sound = this.soundChoice.sound;
  readonly soundVideo = this.soundChoice.video;
  /**
   * The video a YouTube sound plays in Ibiza, and whether only its sound is wanted, or `null` with Music or No music
   * and with the class video (L2-186 AC1 to AC3).
   */
  readonly youtube = computed(() => {
    const sound = this.soundChoice.sound();
    const ride = this.loaded();
    if (this.way !== 'ibiza' || !ride || (sound !== 'youtube-video' && sound !== 'youtube-audio'))
      return null;
    const source: YouTubeSource =
      this.soundChoice.video() === 'class'
        ? {
            videoId: ride.video.videoId,
            syncOffsetSeconds: ride.video.syncOffsetSeconds,
            title: ride.title,
          }
        : DEFAULT_VIDEO;
    return { ...source, audio: sound === 'youtube-audio' };
  });
  /** Whether the chosen YouTube video cannot play: a notice under the course says so (L2-186 AC6). */
  readonly youtubeUnavailable = computed(() => this.youtube() !== null && this.videoUnavailable());
  /** Whether the music can play: Music is disabled in the Sound panel once it cannot (L2-176 AC7). */
  readonly musicAvailable = this.music.available;

  /** The rider chose a sound: it applies at once and is kept for the next ride (L2-185 AC2, AC3). */
  chooseSound(sound: Sound): void {
    this.soundChoice.choose(sound);
  }

  /** The rider chose the video a YouTube sound plays (L2-185 AC2). */
  chooseVideo(video: SoundVideo): void {
    this.soundChoice.chooseVideo(video);
  }

  /**
   * Plays the class video in `host`, the frame the page renders once the class has arrived; called once. Before "Go!"
   * the video is parked at the sync offset and plays from it on "Go!" (L2-180 AC4); a player that arrives later plays
   * from the offset plus the clock, as the ride does.
   */
  playVideo(host: HTMLElement): void {
    const ride = this.loaded();
    if (!ride || this.videoHost) return;
    this.videoHost = host;
    this.loadPlayer(host, { ...ride.video, title: ride.title });
  }

  /**
   * The YouTube inset is drawn in Ibiza (L2-186 AC1): the chosen video's player is made in it. The `video` library and
   * YouTube are fetched only now, when a YouTube sound is first chosen (AC4).
   */
  playInset(host: HTMLElement): void {
    this.insetHost = host;
    this.insetVideo = null;
    this.followYouTube();
  }

  /**
   * Makes the inset's player follow the rider's choice (L2-186 AC5): a new video destroys the player and loads the
   * other; Music or No music destroys it; YouTube video and YouTube audio share one player, so moving between them
   * reloads nothing.
   */
  private followYouTube(): void {
    const youtube = this.youtube();
    const videoId = youtube?.videoId ?? null;
    if (videoId === this.insetVideo) return;
    this.insetVideo = videoId;
    this.playerAsked++;
    this.player()?.destroy();
    this.player.set(null);
    this.playerMissing.set(false);
    this.stalled.set(false);
    this.stall.reset();
    if (youtube === null) return void (this.insetHost = null);
    if (this.insetHost === null) return void (this.insetVideo = null);
    // YouTube's player takes the element it is given: each video gets its own, in the inset.
    const frame = this.insetHost.ownerDocument.createElement('div');
    this.insetHost.replaceChildren(frame);
    this.loadPlayer(frame, youtube);
  }

  /**
   * Plays `source` in `host`. Before "Go!", or while the ride is held, the video is parked at the clock plus its sync
   * offset, and plays from there on "Go!" or when the ride carries on (L2-180 AC4, L2-185 AC7); a player that arrives
   * later plays from the offset plus the clock, as the ride does. A player the ride no longer wants is destroyed.
   */
  private loadPlayer(host: HTMLElement, source: YouTubeSource): void {
    const asked = ++this.playerAsked;
    this.playerFactory().then(
      (player) => {
        if (this.destroyed || asked !== this.playerAsked) return player.destroy();
        this.player.set(player);
        const parked = this.stage() !== 'riding' || this.held();
        void player
          .load(host, source.videoId, {
            startSeconds: source.syncOffsetSeconds + this.clock.elapsedMs() / 1000,
            controls: false,
            autoplay: !parked,
            title: source.title,
          })
          // "Go!" came while the player was still loading: it plays on from the clock.
          .then(() => {
            if (parked && this.stage() === 'riding' && !this.held()) this.carryOn();
          });
      },
      () => {
        if (asked === this.playerAsked) this.playerMissing.set(true);
      },
    );
  }

  /** Whether the ride is held, by the rider or by a lost bike. */
  private held(): boolean {
    return this.pausedByRider() || this.pausedByBike();
  }

  /** The video time at which the ride's 0:00 stands: the class video's offset, or the chosen YouTube video's. */
  private syncOffset(): number {
    if (this.way === 'ibiza') return this.youtube()?.syncOffsetSeconds ?? 0;
    return this.loaded()?.video.syncOffsetSeconds ?? 0;
  }

  /** The course's files could not be loaded, were malformed, or its graphics context was lost for good. */
  failCourse(): void {
    this.courseFailed.set(true);
  }

  /** The course's first frame has been drawn: it takes the box from its still (L2-175 AC1, AC3). */
  showCourse(): void {
    this.courseShown.set(true);
  }

  /** Holds the clock, the plan and the video where they are, and says so once (L2-091 AC1, AC3, L2-088 AC3). */
  pause(): void {
    if (this.stage() !== 'riding' || this.pausedByRider() || this.bikeLost()) return;
    this.pausedByRider.set(true);
    this.announcer.announce(pauseAnnouncement(true));
    if (!this.pausedByBike()) this.hold();
  }

  /**
   * Carries the ride on from where it was held, with the video back on the clock, and says so once (L2-091 AC2, AC3).
   * Not while the bike is lost: only the bike coming back ends that hold (L2-092 AC2).
   */
  resume(): void {
    const ride = this.loaded();
    if (!this.pausedByRider() || this.bikeLost() || !ride) return;
    this.pausedByRider.set(false);
    this.announcer.announce(pauseAnnouncement(false));
    if (!this.pausedByBike()) this.carryOn();
  }

  /** Tries the lost bike at once, rather than at the connection's next retry: the alert's Reconnect. */
  reconnect(): void {
    this.connection.reconnectNow();
  }

  /** The ride's intensity, 0 to 10, which scales every level the plan sends (L2-183). */
  readonly intensity = this.rideIntensity.value;

  /**
   * The rider set the intensity: the engine sends the current segment at it at once and every later one (L2-183 AC4),
   * and a screen reader hears it once (AC7). Not while the stepper is off (AC6).
   */
  setIntensity(intensity: number): void {
    if (this.stepperOff()) return;
    if (this.rideIntensity.set(intensity))
      this.announcer.announce(`Intensity ${this.rideIntensity.value()} of 10`);
  }

  raise(): void {
    void this.resistance.nudge(1);
  }

  lower(): void {
    void this.resistance.nudge(-1);
  }

  /**
   * Class Ride has taken the screen: the countdown begins, "3" with the bike already set (L2-180 AC1, AC3). Called
   * once; the ride's clock does not start until "Go!".
   */
  beginCountdown(): void {
    if (this.stage() !== 'waiting') return;
    this.stage.set('countdown');
    this.countdownTimer.start();
  }

  /** "Go!": the ride's clock starts at the instant it was due, and the video, the course and the music follow it. */
  private go(at: number): void {
    const ride = this.loaded();
    if (!ride || this.destroyed) return;
    this.stage.set('riding');
    this.recorder = new RideRecorder();
    this.efforts = new EffortTally(ride.plan.segments);
    this.activity.begin();
    this.clock.start(at);
    this.ticker.start();
    this.player()?.play();
  }

  /** The ride is always solo (ADR 0038). The engine follows the plan now; the clock waits for "Go!". */
  private start(dto: ClassDefinition): void {
    this.loaded.set(dto);
    this.wakeLock.hold();
    this.engine.follow(dto.plan);
    this.countdownTimer.go.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((at) => this.go(at));
    effect(() => {
      const stage = this.ending.state()?.stage;
      if (stage === 'roll-out') untracked(() => this.stage.set('rolling-out'));
      if (stage === 'over') untracked(() => this.close());
    });
    this.ticker.ticks.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((second) => {
      this.record(Math.min(second, dto.lengthSeconds));
      if (second >= dto.lengthSeconds) return this.finish(dto);
      // A ride in Ibiza has no video to stall (L2-174 AC1), unless the rider chose a YouTube sound (L2-186 AC6).
      if (this.way === 'video' || this.youtube() !== null)
        this.stalled.set(this.stall.check(this.player()?.state() ?? 'loading', second));
      this.syncVideo();
    });
    // The bike is watched on a beat of its own: the ride clock's ticks stop while the ride is held.
    this.beat.seconds.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.followBike());
  }

  /**
   * The ride waits for a lost bike: checked once a second, it holds within a second of the drop and carries on
   * within a second of the bike's return, unless the rider had paused it before (L2-092 AC4). The alert shows at once.
   * When the bike is back the current segment's level is sent again, after the target the connection kept and sent
   * first (L2-017 AC4, L2-027 AC4, L2-092 AC3), whether or not the rider had paused.
   */
  private followBike(): void {
    const lost = this.bikeLost();
    if (lost === this.pausedByBike()) return;
    this.pausedByBike.set(lost);
    if (!lost) this.engine.resend();
    // No ride has started: a lost bike stops the countdown, and it starts again from "3" when the bike is back (L2-180 AC7).
    if (this.stage() === 'countdown')
      return lost ? this.countdownTimer.stop() : this.countdownTimer.start();
    if (this.stage() !== 'riding') return;
    if (this.pausedByRider()) return;
    if (lost) this.hold();
    else this.carryOn();
  }

  /**
   * The plan's end: the clock stops at the class length, the video pauses, and Class Done opens with the class's result
   * in the navigation's state (L2-093 AC2, L2-078 AC1). The ride is sent nowhere (L2-132 AC3, ADR 0039). Leaving the
   * page releases the rest.
   */
  private finish(ride: ClassDefinition): void {
    this.clock.pause();
    this.ticker.stop();
    // The best before this ride is counted: Class Done compares with it, and a reload still does (L2-077).
    const previousBestKj = this.rideRecord.read().bestKj;
    const classResult: ClassResult = {
      classId: ride.id,
      title: ride.title,
      elapsedSeconds: ride.lengthSeconds,
      outputKj: this.recorder?.outputKj ?? 0,
      onTargetShare: this.recorder?.onTargetShare ?? 0,
      previousBestKj,
      efforts: this.efforts?.watts() ?? [],
      // Only a ride that reaches its end is counted (L2-168 AC1, AC2); Class Done says when the device would not keep it.
      saved: true,
      // Class Done asks whether to keep the intensity the ride ended at (L2-184 AC1).
      intensity: this.rideIntensity.value(),
    };
    const saved = this.rideRecord.add(classResult.outputKj);
    this.classResult = { ...classResult, saved };
    this.result.set({
      outputKj: Math.round(classResult.outputKj),
      elapsedSeconds: classResult.elapsedSeconds,
    });
    // The banner shows, then the roll-out; the video and the music play on through both (L2-181 AC1).
    this.stage.set('finished');
    this.ending.start();
    // The bike eases off while the banner shows (L2-182 AC1).
    this.easeOff.start();
  }

  /** The ending is over: the ride is released and Class Done opens with its result (L2-078 AC1). */
  private close(): void {
    this.player()?.pause();
    this.wakeLock.release();
    this.music.release();
    this.activity.end();
    this.easeOff.stop();
    this.connection.forgetTarget();
    void this.router.navigateByUrl('/done', { state: { classResult: this.classResult } });
  }

  /**
   * Each second ridden at the bike's power (L2-022 AC2), on target when the power is within 10 % of the
   * segment's target (L2-037 AC3); seconds a hidden tab skipped count at those of the moment, and a held ride's clock
   * does not tick.
   */
  private record(second: number): void {
    const power = this.telemetry.powerW();
    const target = this.plan()?.targetPower ?? null;
    const onTarget = power !== null && target !== null && PowerModel.onTarget(power, target);
    this.recorder?.record(power, second - this.lastSecond, onTarget);
    this.efforts?.add(power, this.lastSecond, second);
    this.lastSecond = second;
  }

  private hold(): void {
    this.clock.pause();
    this.player()?.pause();
  }

  private carryOn(): void {
    this.clock.resume();
    const player = this.player();
    player?.seekTo(this.syncOffset() + this.clock.elapsedMs() / 1000);
    player?.play();
  }

  private syncVideo(): void {
    const player = this.player();
    if (player?.state() !== 'playing') return;
    // A player that became ready during a pause starts playing on its own; it follows the pause instead.
    if (this.held()) return player.pause();
    const elapsed = this.clock.elapsedMs() / 1000;
    const seek = this.sync.check(player.currentTime(), elapsed, this.syncOffset());
    if (seek !== null) player.seekTo(seek);
  }
}

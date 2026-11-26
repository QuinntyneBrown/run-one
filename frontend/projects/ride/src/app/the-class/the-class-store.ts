import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  BIKE_CONNECTION,
  BLUETOOTH_SUPPORT,
  COURSE_GRAPHICS,
  type ClassDefinition,
  HOW_TO_RIDE,
  REMEMBERED_BIKE,
  type RideWith,
  THE_CLASS,
  type TheClassSource,
  type TheClassView,
  VIDEO_PLAYER_FACTORY,
  type VideoPlayer,
  RIDE_RECORD,
} from '@telo/api';
import { isBlocked, rideWith } from '@telo/domain';
import { theClassView } from './the-class-view';

/** The class, or `null` for one that is refused because it breaks a rule (L2-080 AC3). */
function read(source: TheClassSource): ClassDefinition | null {
  try {
    return source.get();
  } catch {
    return null;
  }
}

/**
 * The Class's state, provided on its page (docs/detailed-designs/the-class/show-the-class): the one class, read from
 * `THE_CLASS` (it ships with the app, ADR 0037), the view the page draws, the connected bike's name for the header,
 * the rider's choice of how to ride, and the class video parked at its sync offset while the ride is with the video.
 * A class that breaks a rule is not offered: there is no view (L2-080 AC3). It goes, with the player, when the rider
 * leaves.
 */
@Injectable()
export class TheClassStore {
  private readonly loaded = read(inject(THE_CLASS));
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  /** The bike this browser remembers names the status before the connection has one (L2-015). */
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly howToRide = inject(HOW_TO_RIDE);
  private readonly record = inject(RIDE_RECORD);
  private readonly drawable = inject(COURSE_GRAPHICS).available();
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private readonly kept = signal(this.howToRide.kept());
  private readonly player = signal<VideoPlayer | null>(null);
  private readonly playerMissing = signal(false);
  private videoHost: HTMLElement | null = null;
  /** Counts each time the player is parked or taken away, so a player that arrives late knows it is not wanted. */
  private turn = 0;
  private destroyed = false;

  /** How the class will be ridden: as kept, and with the video where the course cannot be drawn (L2-173 AC1, AC6). */
  readonly rideWith = computed(() => rideWith(this.kept(), this.drawable));

  /** The connected bike's name for the header's link, or `null` with no connected bike (L2-019 AC1, AC2). */
  readonly bikeName = computed(() =>
    this.connection.ble() === 'connected'
      ? ((this.connection.bike() ?? this.remembered)?.name ?? 'Bike')
      : null,
  );

  /** The Class as it is drawn, or `null` for a class that is not offered. */
  readonly view = computed<TheClassView | null>(() =>
    this.loaded
      ? theClassView({
          definition: this.loaded,
          connected: this.connection.ble() === 'connected',
          blocked: isBlocked(this.support.state()),
          rideWith: this.rideWith(),
          drawable: this.drawable,
          videoUnavailable: this.playerMissing() || this.player()?.state() === 'error',
          record: this.record.read(),
        })
      : null,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.player()?.destroy();
    });
  }

  /**
   * The rider chooses how to ride (L2-173 AC2): kept on the device at once. With Ibiza the parked player goes, and the
   * course's still stands in its box (AC3); with the class video the player is parked again (AC4).
   */
  choose(way: RideWith): void {
    if (way === 'ibiza' && !this.drawable) return;
    if (way === this.rideWith()) return;
    this.howToRide.keep(way);
    this.kept.set(way);
    if (way === 'video') this.park();
    else this.unpark();
  }

  /**
   * Takes the element the player embeds in, once it is drawn, and parks the class video there at its sync offset with
   * YouTube's controls, waiting for the rider (L2-084 AC1), unless the ride is in Ibiza.
   */
  parkVideo(host: HTMLElement): void {
    this.videoHost = host;
    this.park();
  }

  private park(): void {
    const dto = this.loaded;
    const host = this.videoHost;
    if (!dto || !host || this.rideWith() !== 'video' || this.playerMissing()) return;
    const turn = ++this.turn;
    this.playerFactory().then(
      (player) => {
        if (this.destroyed || turn !== this.turn) return player.destroy();
        this.player.set(player);
        void player.load(host, dto.video.videoId, {
          startSeconds: dto.video.syncOffsetSeconds,
          controls: true,
          autoplay: false,
          title: `Video: ${dto.title}`,
        });
      },
      // Without the player's code the cover stays, and the class can still be ridden (L2-084 AC9).
      () => this.playerMissing.set(true),
    );
  }

  private unpark(): void {
    this.turn++;
    this.player()?.destroy();
    this.player.set(null);
  }
}

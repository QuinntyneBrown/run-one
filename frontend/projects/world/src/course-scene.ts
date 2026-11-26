import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { type Backend, COURSE_RENDERER, type CourseRenderer, type Segment } from '@telo/api';
import { FrameScheduler } from './frame-scheduler';
import { MotionPreference } from './motion-preference';
import { SceneDriver } from './scene-driver';

/** How long a lost graphics context has to come back before the course is given up (L2-175 AC2). */
const CONTEXT_GRACE_MS = 3_000;

/**
 * The course drawn on a canvas that fills the box it is put in (L2-174 AC1). It loads the renderer on first render,
 * which fetches the course's files (L2-175 AC1), draws on the app's frame loop while the ride runs, and emits `drawn`
 * once, when the ride's first frame has been drawn where the clock puts the rider (AC3); until then the canvas is
 * unseen and unnamed. It emits `unavailable` once when the course cannot be drawn: its files cannot be loaded, or its
 * graphics context is lost and does not come back within a few seconds (L2-175 AC2). Leaving stops the loop and
 * disposes the renderer (L2-174 AC8).
 */
@Component({
  selector: 'wz-course-scene',
  templateUrl: './course-scene.html',
  styleUrl: './course-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseScene implements AfterViewInit {
  /** The course's name, which names the canvas for a screen reader: "Ibiza Sunset Strip" (L2-174 AC1). */
  readonly label = input.required<string>();
  /** The plan the ride follows. */
  readonly segments = input.required<readonly Segment[]>();
  /** The ride clock's whole seconds, which place the rider (L2-174 AC2). */
  readonly elapsed = input.required<number>();
  /** The bike's speed, which turns the pedals. */
  readonly speedKmh = input.required<number | null>();
  /** Whether the ride runs; a ride that is paused or waits for its bike holds the course still (L2-174 AC5). */
  readonly running = input.required<boolean>();
  /** Reduce motion as the app asks for it; null follows this device's `prefers-reduced-motion`. */
  readonly reducedMotion = input<boolean | null>(null);
  /** The share of the flyover's flight flown, 0 to 1, or `null` for the chase camera of the ride (L2-179 AC2). */
  readonly flyover = input<number | null>(null);
  /** Emitted once when the course's files cannot be loaded or the renderer fails to start. */
  readonly unavailable = output<void>();
  /** Emitted once the ride's first frame has been drawn, with the GPU API drawing the course. */
  readonly drawn = output<Backend>();

  private readonly load = inject(COURSE_RENDERER);
  private readonly frames = inject(FrameScheduler);
  private readonly motion = inject(MotionPreference);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  /** Set once the renderer has started. */
  private readonly driver = signal<SceneDriver | null>(null);
  /** Set once the ride's first frame has been drawn: the canvas shows and takes its name. */
  protected readonly shown = signal(false);
  /** Whether the tab shows: a hidden tab draws no frame, not even for a change of the clock's second (L2-174 AC9). */
  private readonly visible = signal(!document.hidden);
  /** True while the display's frame period is measured again: the scene holds its picture. */
  private readonly measuring = signal(false);

  private startOnView: () => void = () => undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let renderer: CourseRenderer | null = null;
    let stop: (() => void) | null = null;
    let observer: ResizeObserver | null = null;
    let screen: MediaQueryList | null = null;
    let destroyed = false;
    let watched: HTMLCanvasElement | null = null;
    let lostTimer: ReturnType<typeof setTimeout> | undefined;

    // A lost graphics context gets a few seconds to come back; if it does not the course is given up: the loop stops,
    // the renderer is released, the canvas is hidden again and the page is told, as when its files cannot be loaded.
    const giveUp = () => {
      lostTimer = undefined;
      if (destroyed || !renderer) return;
      stop?.();
      stop = null;
      observer?.disconnect();
      observer = null;
      this.driver.set(null);
      this.shown.set(false);
      renderer.dispose();
      renderer = null;
      this.unavailable.emit();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      clearTimeout(lostTimer);
      lostTimer = setTimeout(giveUp, CONTEXT_GRACE_MS);
    };
    const onContextRestored = () => {
      clearTimeout(lostTimer);
      lostTimer = undefined;
    };

    // The tab's return or another screen may change the display's refresh rate: measure it again, judging and
    // drawing nothing meanwhile.
    const remeasure = () => {
      const r = renderer;
      if (!r || destroyed || untracked(this.measuring)) return;
      r.pauseBudget();
      this.measuring.set(true);
      void this.frames.measurePeriod().then((period) => {
        if (destroyed) return;
        r.setFramePeriod(period);
        this.measuring.set(false);
      });
    };
    const onVisibility = () => {
      this.visible.set(!document.hidden);
      if (!document.hidden) remeasure();
    };
    const onScreen = () => {
      watchScreen();
      remeasure();
    };
    const watchScreen = () => {
      screen?.removeEventListener('change', onScreen);
      screen = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      screen.addEventListener('change', onScreen);
    };
    destroyRef.onDestroy(() => {
      destroyed = true;
      clearTimeout(lostTimer);
      watched?.removeEventListener('webglcontextlost', onContextLost);
      watched?.removeEventListener('webglcontextrestored', onContextRestored);
      stop?.();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      screen?.removeEventListener('change', onScreen);
      renderer?.dispose();
    });

    // Draws with a started renderer from now on: sized to its canvas, on the loop, until the scene goes.
    const begin = (loaded: CourseRenderer, canvas: HTMLCanvasElement) => {
      renderer = loaded;
      watched = canvas;
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
      const resize = () => loaded.resize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio);
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
      document.addEventListener('visibilitychange', onVisibility);
      watchScreen();
      this.driver.set(new SceneDriver(loaded));
    };

    // Started once the view is in place: `ngAfterViewInit` rather than `afterNextRender`, whose render hooks would
    // grow the initial bundle.
    this.startOnView = () => {
      const canvas = this.canvas().nativeElement;
      // The display's frame period is measured before the scene's own work can slow it.
      void Promise.all([this.load(), this.frames.measurePeriod()])
        .then(async ([loaded, period]) => {
          const started = await loaded.start(
            canvas,
            () => this.frames.nextFrame(),
            untracked(this.segments),
          );
          if (started) loaded.setFramePeriod(period);
          return { loaded, started };
        })
        .then(
          ({ loaded, started }) => {
            if (destroyed) {
              loaded.dispose();
              return;
            }
            if (!started) {
              loaded.dispose();
              this.unavailable.emit();
              return;
            }
            begin(loaded, canvas);
          },
          () => {
            if (!destroyed) this.unavailable.emit();
          },
        );
    };

    // The loop runs only while the ride runs: a held course holds still, and the app's loop requests no frame while
    // the tab is hidden.
    effect(() => {
      const running = this.driver() !== null && this.running();
      if (running && !stop) stop = this.frames.startLoop();
      if (!running && stop) {
        stop();
        stop = null;
      }
    });

    // One frame per tick of the loop, and one whenever the inputs change. The first is drawn where the clock has
    // got to, and shows the canvas (L2-175 AC3).
    effect(() => {
      const driver = this.driver();
      if (!driver || this.measuring() || !this.visible()) return;
      driver.frame(this.frames.now(), {
        elapsed: this.elapsed(),
        speedKmh: this.speedKmh(),
        running: this.running(),
        reducedMotion: this.reducedMotion() ?? this.motion.reduced(),
        flyover: this.flyover(),
      });
      if (untracked(this.shown) || !renderer) return;
      const backend = renderer.backend;
      untracked(() => {
        this.shown.set(true);
        this.drawn.emit(backend);
      });
    });
  }

  ngAfterViewInit(): void {
    this.startOnView();
  }
}

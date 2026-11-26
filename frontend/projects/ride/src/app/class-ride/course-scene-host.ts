import {
  afterNextRender,
  type ComponentRef,
  DestroyRef,
  Directive,
  ViewContainerRef,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { DISPLAY_PREFERENCES, type Segment } from '@telo/api';
import type { CourseScene } from '@telo/world';
import { CourseSession } from './course-session';

/**
 * The course in a screen's box: Class Ride's (L2-174 AC1, L2-175 AC1) or the flyover's (L2-179 AC1). It borrows the one
 * `CourseScene` from the ride's `CourseSession`, which imports the `world` library the first time it is asked, so
 * neither the library nor Three.js is in a screen's own chunk and a ride with the class video never loads them. When
 * the scene is shown here it is handed this host's inputs; leaving takes it out without destroying it, for the next
 * screen. A dynamic import and `setInput`, rather than `@defer`, whose runtime would grow the initial bundle.
 */
@Directive({ selector: '[wzCourseScene]' })
export class CourseSceneHost {
  /** The course's name, which names its canvas: "Ibiza Sunset Strip". */
  readonly name = input.required<string>({ alias: 'wzCourseScene' });
  /** What names the canvas, where it is not the course's name: "Ibiza Sunset Strip from above" in the flyover. */
  readonly label = input<string | null>(null);
  readonly segments = input.required<readonly Segment[]>();
  readonly elapsed = input.required<number>();
  readonly speedKmh = input.required<number | null>();
  readonly running = input.required<boolean>();
  /** The share of the flyover's flight flown, or `null` for the chase camera of the ride (L2-179 AC2). */
  readonly flyover = input<number | null>(null);
  /** Emitted once the course's first frame has been drawn, where the clock puts the rider (L2-175 AC3). */
  readonly drawn = output<void>();
  /** Emitted once when the course's files cannot be loaded or are malformed, or its graphics context is lost for good (L2-175 AC2). */
  readonly unavailable = output<void>();

  private readonly session = inject(CourseSession);
  /** Reduced motion as this device asks for it (L2-142). */
  private readonly display = inject(DISPLAY_PREFERENCES);

  constructor() {
    const place = inject(ViewContainerRef).element.nativeElement as Comment;
    // Once the screen's markup is in the page, so the scene's element has somewhere to stand.
    afterNextRender(() => this.session.attach(place));
    inject(DestroyRef).onDestroy(() => this.session.detach(place));
    effect(() => {
      const scene = this.session.scene();
      if (scene) this.bind(scene);
    });
    // The session says once; a host that arrives after the scene has been drawn is told at once.
    effect(() => {
      if (this.session.drawn()) untracked(() => this.drawn.emit());
    });
    effect(() => {
      if (this.session.unavailable()) untracked(() => this.unavailable.emit());
    });
  }

  /** Hands the scene this screen's inputs; read in the effect, they follow the ride. */
  private bind(scene: ComponentRef<CourseScene>): void {
    scene.setInput('label', this.label() ?? this.name());
    scene.setInput('segments', this.segments());
    scene.setInput('elapsed', this.elapsed());
    scene.setInput('speedKmh', this.speedKmh());
    scene.setInput('running', this.running());
    scene.setInput('reducedMotion', this.display.reducedMotion());
    scene.setInput('flyover', this.flyover());
  }
}

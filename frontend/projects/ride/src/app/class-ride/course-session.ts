import {
  ApplicationRef,
  type ComponentRef,
  DestroyRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import type { CourseScene } from '@telo/world';

/**
 * The one course scene a ride in Ibiza draws on, for the flyover and for Class Ride (L2-179 AC3). It imports the `world`
 * library when a host first asks for the scene and creates the library's `CourseScene` once, which fetches the course's
 * files and builds the renderer. The scene belongs to the session, not to a screen: its element is moved from one
 * screen's place to the next, so its canvas, its graphics context and its renderer are not made twice, and it is not
 * destroyed with the flyover. Destroying the owner destroys the scene, which stops its frame loop and disposes the
 * renderer, whichever screen the rider leaves from (L2-174 AC8). A ride with the class video never asks, so neither the
 * library nor the course's files are fetched (L2-136 AC1). Provided by the ride's page.
 */
@Injectable()
export class CourseSession {
  private readonly app = inject(ApplicationRef);
  private readonly environment = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly ref = signal<ComponentRef<CourseScene> | null>(null);
  private readonly isDrawn = signal(false);
  private readonly isUnavailable = signal(false);
  private place: Comment | null = null;
  private loading = false;
  private destroyed = false;

  /** The scene, once the library has come and it is created. */
  readonly scene = this.ref.asReadonly();
  /** Whether the scene's first frame has been drawn. */
  readonly drawn = this.isDrawn.asReadonly();
  /** Whether the course cannot be drawn: its files, its renderer or its graphics context failed. */
  readonly unavailable = this.isUnavailable.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.ref()?.destroy();
    });
  }

  /** Shows the scene at `place`, a node in the screen's own markup, making the scene first if this is the first ask. */
  attach(place: Comment): void {
    this.place = place;
    const ref = this.ref();
    if (ref) return this.show(ref);
    if (this.loading) return;
    this.loading = true;
    void import('@telo/world').then((library) => {
      if (this.destroyed) return;
      const scene = createComponent(library.CourseScene, {
        environmentInjector: this.environment,
        elementInjector: this.injector,
      });
      this.app.attachView(scene.hostView);
      scene.instance.drawn.subscribe(() => this.isDrawn.set(true));
      scene.instance.unavailable.subscribe(() => this.isUnavailable.set(true));
      this.show(scene);
      this.ref.set(scene);
    });
  }

  /** Lets go of `place`; the scene stays, for the next screen to show. */
  detach(place: Comment): void {
    if (this.place === place) this.place = null;
  }

  private show(scene: ComponentRef<CourseScene>): void {
    const place = this.place;
    const element = scene.location.nativeElement as HTMLElement;
    if (place?.parentNode) place.parentNode.insertBefore(element, place);
  }
}

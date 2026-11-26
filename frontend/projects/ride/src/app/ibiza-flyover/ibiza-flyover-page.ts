import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IbizaFlyover } from '@telo/components';
import { THE_CLASS } from '@telo/api';
import { CourseSceneHost } from '../class-ride/course-scene-host';
import { IBIZA_SUNSET_STRIP } from '../classes/ibiza-sunset-strip';
import { FlyoverStore } from './flyover-store';

/**
 * Ibiza Flyover (docs/mocks/pages/ibiza-flyover/, L2-179): what `/ride` shows before a ride in Ibiza starts. The course
 * is drawn from above in its scene slot, edge to edge between the bar and the band; the class is not started. It emits
 * `done` when Class Ride is to open on its countdown.
 */
@Component({
  selector: 'wz-ibiza-flyover-page',
  imports: [IbizaFlyover, CourseSceneHost],
  templateUrl: './ibiza-flyover-page.html',
  styleUrl: './ibiza-flyover-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FlyoverStore],
})
export class IbizaFlyoverPage {
  protected readonly store = inject(FlyoverStore);
  protected readonly course = IBIZA_SUNSET_STRIP;
  protected readonly ride = inject(THE_CLASS).get();
  readonly done = output<void>();

  constructor() {
    this.store.done.pipe(takeUntilDestroyed()).subscribe(() => this.done.emit());
  }
}

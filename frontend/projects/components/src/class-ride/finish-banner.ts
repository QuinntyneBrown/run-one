import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatClock } from '../metric/format-clock';

/**
 * The finish banner across the video's or the course's box (design-system block finish-banner, L2-181): a chequered
 * edge above and below, "Finish!" and the ride's output and time. It says nothing of a best, a place or another rider
 * (AC8). The band is drawn, not read; a status says "Finished. 351 kJ." once (AC6).
 */
@Component({
  selector: 'wz-finish-banner',
  templateUrl: './finish-banner.html',
  styleUrl: './finish-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinishBanner {
  /** The ride's output in whole kJ, as Class Done shows it. */
  readonly outputKj = input.required<number>();
  readonly elapsedSeconds = input.required<number>();
  protected readonly time = computed(() => formatClock(this.elapsedSeconds()));
}

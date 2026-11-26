import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Lockup } from '../lockup/lockup';
import { formatClock } from '../metric/format-clock';

/**
 * The class ride's header (design-system block class-header, docs/mocks/pages/class-ride/): the small lockup, the
 * class and its mode ("Intervals to the Beat · Solo", hidden below md), and the clock ("5:30 / 20:00", the total
 * hidden on a phone) as a timer (L2-087 AC1, AC2). The page puts its buttons in the `end` slot.
 */
@Component({
  selector: 'wz-class-header',
  imports: [Lockup],
  templateUrl: './class-header.html',
  styleUrl: './class-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassHeader {
  readonly title = input.required<string>();
  /** "Solo". */
  readonly mode = input.required<string>();
  /** Whole seconds of the ride clock. */
  readonly elapsed = input.required<number>();
  /** The class's length in seconds. */
  readonly total = input.required<number>();

  protected readonly clock = computed(() => formatClock(this.elapsed()));
  protected readonly length = computed(() => formatClock(this.total()));
}

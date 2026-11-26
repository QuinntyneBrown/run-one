import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { EffortBar } from '@telo/api';
import { InlineMessage } from '../inline-message/inline-message';
import { Lockup } from '../lockup/lockup';

/**
 * Class Done (design-system block class-done, docs/mocks/pages/class-done/): the header with the wordmark, the class
 * and Full screen (`end` slot), the verdict, the output in kJ (gold for a new best) with the facts under it, and Done
 * (`actions` slot), and the efforts as a chart of bars.
 */
@Component({
  selector: 'wz-class-done',
  imports: [InlineMessage, Lockup],
  templateUrl: './class-done.html',
  styleUrl: './class-done.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassDone {
  /** The class: "Intervals to the Beat". */
  readonly title = input.required<string>();
  /** The output as a whole number: "351". */
  readonly output = input.required<string>();
  /** The ride's running time: "20:00". */
  readonly time = input.required<string>();
  /** The average watts as a whole number: "293". */
  readonly average = input.required<string>();
  /** The share of the ride on target: "84%" (L2-170). */
  readonly onTarget = input.required<string>();
  /** The `h1`: the verdict on the ride (L2-077). */
  readonly verdict = input.required<string>();
  /** A new best: the verdict and the output are gold, and the words carry it too (L2-077 AC4). */
  readonly best = input(false);
  /** The best fact: "Previous best" or "Best", with its kJ; none for the first ride. */
  readonly bestFact = input<{ readonly label: string; readonly value: string } | null>(null);
  /** The class's efforts, a bar each, in plan order (L2-169). */
  readonly efforts = input<readonly EffortBar[]>([]);
  /** Whether the ride was kept in the record; a notice says when it was not (L2-168 AC4). */
  readonly saved = input(true);

  /** The class that sets a bar's height: its share of the strongest effort's, in whole percent (the stylesheet has 0 to 100). */
  protected shareClass(effort: EffortBar): string {
    return `class-done__effort--share-${Math.round(effort.height)}`;
  }
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';

/** Where the question stands: asked, answered with the default kept, or answered and the device would not keep it. */
export type IntensityAnswer = 'ask' | 'kept' | 'refused';

/**
 * The intensity question on Class Done (design-system block class-done__intensity; docs/mocks/pages/class-done/
 * intensity and intensity-kept, L2-184): "Make 7/10 your intensity?" with "Make it my default" and "Keep 5/10", then,
 * once kept, "7/10 is now your intensity." as a status with no buttons. Done stays the screen's one primary button.
 */
@Component({
  selector: 'wz-intensity-question',
  imports: [Button],
  templateUrl: './intensity-question.html',
  styleUrl: './intensity-question.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntensityQuestion {
  /** The ride's intensity at 20:00. */
  readonly intensity = input.required<number>();
  /** The kept default it would replace. */
  readonly current = input.required<number>();
  readonly answer = input<IntensityAnswer>('ask');
  /** "Make it my default". */
  readonly keep = output<void>();
  /** "Keep 5/10". */
  readonly dismiss = output<void>();
}

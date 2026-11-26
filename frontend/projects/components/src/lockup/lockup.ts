import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/** `md` in a screen's header; `sm` in the slim headers of the class and the class ride. */
export type LockupSize = 'md' | 'sm';

/**
 * The TELO RIDE 1 lockup (design-system block lockup): the logo mark and the wordmark, with "RIDE 1" in the signal
 * colour, one image named "Telo Ride 1" (L2-172).
 */
@Component({
  selector: 'wz-lockup',
  templateUrl: './lockup.html',
  styleUrl: './lockup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lockup {
  readonly size = input<LockupSize>('md');
  /** Class Ride only: below 384 px the words are not drawn and the mark stays (L2-172 AC3). */
  readonly markOnlyWhenNarrow = input(false, { transform: booleanAttribute });
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The screens that keep something at their foot, which the mark stands clear of. */
export type DiagnosticMarkScreen = 'the-class' | 'class-ride';

/**
 * The recording mark (design-system block diagnostic-mark; L2-178 AC2): the button every screen shows while the
 * diagnostic recording is on, fixed at the foot of the screen at the left. Its dot and its word say so together, never
 * colour alone. Put it on a native button, so it keeps its role and its keys, with its word as its content:
 * `<button wz-diagnostic-mark type="button">Recording</button>`.
 */
@Component({
  selector: 'button[wz-diagnostic-mark]',
  templateUrl: './diagnostic-mark.html',
  styleUrl: './diagnostic-mark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'diagnostic-mark',
    '[class.diagnostic-mark--busy]': 'busy()',
    '[class.diagnostic-mark--on-the-class]': 'screen() === "the-class"',
    '[class.diagnostic-mark--on-class-ride]': 'screen() === "class-ride"',
    '[attr.aria-busy]': 'busy() ? "true" : null',
    '[attr.aria-disabled]': 'busy() ? "true" : null',
  },
})
export class DiagnosticMark {
  /** A screen capture is being taken (L2-178 AC13): the page gives the mark the word "Capturing…" until it ends. */
  readonly busy = input(false);
  /** The screen the mark is on, where that screen keeps its foot for something else. */
  readonly screen = input<DiagnosticMarkScreen | null>(null);
}

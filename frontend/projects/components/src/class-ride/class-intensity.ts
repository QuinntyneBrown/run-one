import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * The ride's intensity, like a volume control (design-system block class-intensity; docs/mocks/pages/class-ride/
 * intensity, ADR 0050): "Intensity", "7/10", "Raise intensity" over a slider standing up over "Lower intensity"
 * (L2-183 AC1). The slider is the platform's range input, so touch, keyboard and screen readers get its own behaviour.
 * On a short box the slider goes and −, the setting and + stand in a row (AC8). It fills the box's controls slot; the
 * page says what a change does.
 */
@Component({
  selector: 'wz-class-intensity',
  templateUrl: './class-intensity.html',
  styleUrl: './class-intensity.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassIntensity {
  /** The ride's intensity, a whole number from 0 to 10. */
  readonly value = input.required<number>();
  /** Whether the control is off, as the stepper is (L2-183 AC6). */
  readonly disabled = input(false);
  /** The intensity the rider slid to. */
  readonly changed = output<number>();
  /** The rider pressed "Raise intensity": a notch up from wherever the ride is, whatever was last drawn. */
  readonly raise = output<void>();
  /** The rider pressed "Lower intensity". */
  readonly lower = output<void>();

  protected slide(event: Event): void {
    this.changed.emit(Number((event.target as HTMLInputElement).value));
  }
}

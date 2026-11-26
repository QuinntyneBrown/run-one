import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import type { RideWith as Way, RideWithOption } from '@telo/api';
import { radioStep } from './radio-step';

/**
 * "Ride with" on The Class (design-system block ride-with; WAI-ARIA radio group; L2-173): the class video or Ibiza
 * Sunset Strip. The chosen option carries `aria-checked="true"`, fills its mark and is the one in the tab order; the
 * arrow keys move the choice between the options that can be chosen. An option that cannot be chosen is
 * `aria-disabled` and says why under its name (AC6, AC7).
 */
@Component({
  selector: 'wz-ride-with',
  templateUrl: './ride-with.html',
  styleUrl: './ride-with.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideWith {
  readonly options = input.required<readonly RideWithOption[]>();
  readonly chosen = input.required<Way>();
  readonly choose = output<Way>();

  // The options are found in the host rather than by viewChildren, whose code would join the initial bundle.
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected pick(option: RideWithOption): void {
    if (!option.disabled) this.choose.emit(option.way);
  }

  protected move(event: KeyboardEvent, index: number): void {
    const options = this.options();
    const next = radioStep(
      event.key,
      index,
      options.map((option) => option.disabled),
    );
    if (next === null) return;
    event.preventDefault();
    this.choose.emit(options[next].way);
    this.host.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }
}

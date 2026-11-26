import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { CountdownStep } from '@telo/api';

/**
 * The countdown over the video's or the course's box (design-system block class-countdown, L2-180): three lights, the
 * numeral and "The plan sets your resistance. Just pedal." The numeral and the lights are drawn, not read; a status says
 * "The class starts in 3 seconds" for "3", "2" and "1" alike and "Go" for "Go!", so a screen reader hears each once and
 * never every numeral (AC8). The numeral and "Go!" carry the meaning as text, and the lights repeat it (AC10).
 */
@Component({
  selector: 'wz-class-countdown',
  templateUrl: './class-countdown.html',
  styleUrl: './class-countdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassCountdown {
  readonly step = input.required<CountdownStep>();
  protected readonly lights = [0, 1, 2];
  protected readonly said = computed(() =>
    this.step().go ? 'Go' : 'The class starts in 3 seconds',
  );
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The roll-out card at the foot of the video's or the course's box (design-system block class-rollout, L2-182 AC4): a
 * title, "Easy spin. Your summary is coming up." and a bar that fills as the roll-out passes. The line is a status, so
 * a screen reader hears it once (AC10); the bar is a progressbar in whole percent.
 */
@Component({
  selector: 'wz-class-rollout',
  templateUrl: './class-rollout.html',
  styleUrl: './class-rollout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The fill's width is a custom property of the host, which the stylesheet reads: no inline style in the template.
  host: { '[style.--value]': "percent() + '%'" },
})
export class ClassRollout {
  readonly title = input.required<string>();
  /** The share of the roll-out that has passed, 0 to 1. */
  readonly progress = input.required<number>();
  protected readonly percent = computed(() =>
    Math.round(Math.min(1, Math.max(0, this.progress())) * 100),
  );
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Segment, SegmentKind } from '@telo/api';

/** Each kind's element of the class-profile block. */
const ELEMENTS: Record<SegmentKind, string> = {
  'warm-up': 'warmup',
  work: 'work',
  recover: 'rest',
  steady: 'steady',
  'cool-down': 'cooldown',
};

/** The tallest bar, in the profile's 32-unit box, and the gap between bars as a share of the plan's length. */
const TALLEST = 24;
const GAP = 0.002;

/**
 * A class's resistance profile (design-system block class-profile): one bar per segment of its plan, as wide as the
 * segment lasts and as tall as its level against the plan's highest level (L2-084 AC2). Without a name it is
 * decorative; on The Class it is an image named "Resistance profile".
 */
@Component({
  selector: 'wz-class-profile',
  templateUrl: './class-profile.html',
  styleUrl: './class-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassProfile {
  readonly segments = input.required<readonly Segment[]>();
  /** Its accessible name when it stands alone ("Resistance profile"); without one it is decorative. */
  readonly label = input<string | null>(null);
  /** `lg` in the carried-over plan chart; `sm` where the hosting block sets the height, as The Class does. */
  readonly size = input<'sm' | 'lg' | 'xl'>('sm');

  protected readonly length = computed(() =>
    this.segments().reduce((total, segment) => total + segment.duration, 0),
  );

  protected readonly bars = computed(() => {
    const segments = this.segments();
    const highest = Math.max(1, ...segments.map((segment) => segment.level));
    const gap = this.length() * GAP;
    let start = 0;
    return segments.map((segment) => {
      const height = Math.max(2, Math.round((TALLEST * segment.level) / highest));
      const bar = {
        element: `class-profile__${ELEMENTS[segment.kind]}`,
        x: start + gap,
        width: Math.max(0, segment.duration - 2 * gap),
        y: 32 - height,
        height,
      };
      start += segment.duration;
      return bar;
    });
  });
}

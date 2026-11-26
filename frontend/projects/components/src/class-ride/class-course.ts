import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InlineMessage } from '../inline-message/inline-message';

/**
 * The course in the video's box, in a ride in Ibiza (design-system block class-course; docs/mocks/pages/class-ride/
 * ibiza, ibiza-loading and paused-ibiza): the course's still under "Loading Ibiza Sunset Strip" until the course is
 * drawn (L2-175 AC1), then the course alone, drawn in the `scene` slot, and the class video's "Paused" over it
 * (L2-091 AC1). When the course cannot be drawn the still stays and a notice stands under the box (L2-175 AC2, docs/
 * mocks/pages/class-ride/ibiza-unavailable). It lays out the Sound button in its `sound` slot (L2-185 AC1), the
 * YouTube inset in its `inset` slot (L2-186 AC1) and the intensity in its `controls` slot (L2-183 AC1); this component
 * only lays them out.
 */
@Component({
  selector: 'wz-class-course',
  imports: [InlineMessage],
  templateUrl: './class-course.html',
  styleUrl: './class-course.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassCourse {
  /** The course's name: "Ibiza Sunset Strip". */
  readonly name = input.required<string>();
  /** The course's still and what it shows, which stands in the box until the course is drawn. */
  readonly still = input.required<{ readonly url: string; readonly alt: string }>();
  /** Whether the course's first frame is still to be drawn: the still and "Loading …" show. */
  readonly loading = input(true);
  /** Draws "Paused" over the course, as the class video does (L2-091 AC1); the page announces the pause itself. */
  readonly paused = input(false);
  /** Whether the course cannot be drawn: the still stays, "Loading …" goes and a notice stands under the box. */
  readonly unavailable = input(false);
  /** Whether the chosen YouTube video cannot play: a notice stands under the box (L2-186 AC6). */
  readonly youtubeUnavailable = input(false);
}

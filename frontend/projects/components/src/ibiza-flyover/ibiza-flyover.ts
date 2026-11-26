import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { Lockup } from '../lockup/lockup';

/**
 * Ibiza Flyover (design-system block ibiza-flyover, docs/mocks/pages/ibiza-flyover/, L2-179): a bar across the top with
 * the wordmark, Skip flyover and Cancel; the course edge to edge between the bar and the band, in the `scene` slot; and
 * a band across the bottom with the course's name, the caption of the place the camera is over, and the bike's status
 * or, with the bike lost, its alert and Try again. No word lies on the course. It injects nothing: the screen drives it.
 */
@Component({
  selector: 'wz-ibiza-flyover',
  imports: [Button, Lockup],
  templateUrl: './ibiza-flyover.html',
  styleUrl: './ibiza-flyover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IbizaFlyover {
  /** The course's name, the page's `h1`. */
  readonly name = input.required<string>();
  /** The course's still, which stands in the scene until the course is drawn. */
  readonly still = input.required<{ readonly url: string; readonly alt: string }>();
  /** Whether the course is still to be drawn: the still and "Loading …" show. */
  readonly loading = input(false);
  /** The place the camera is over and its line, or `null` while loading. */
  readonly caption = input<{ readonly place: string; readonly line: string } | null>(null);
  /** Whether the camera has landed on the grid: the caption is said once and Skip goes. */
  readonly landed = input(false);
  /** What the band says of the bike: "Echelon EX-5s connected", or "Bike ready · lining up" once landed. */
  readonly status = input.required<string>();
  /** Whether the bike has stopped answering: the band shows the alert and Try again in place of the status. */
  readonly bikeLost = input(false);
  /** What the alert says when the bike is lost. */
  readonly lostLine = input('');
  /** Whether Skip flyover shows: not once the camera has landed. */
  readonly canSkip = input(true);
  readonly skip = output<void>();
  readonly cancelled = output<void>();
  readonly retry = output<void>();
}

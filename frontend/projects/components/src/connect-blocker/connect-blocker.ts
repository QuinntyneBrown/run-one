import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';

/** The picture beside the title: Bluetooth struck out, a globe, a padlock, or a barred circle. */
export type ConnectBlockerIcon = 'bluetooth-off' | 'browser' | 'lock' | 'blocked';

/**
 * The alert that stands in for the device card on Connect Bike when the bike cannot be reached (design-system block
 * connect-blocker, docs/mocks/pages/connect-bike/bluetooth-off, unsupported-browser, needs-https, chooser-blocked and
 * chooser-failed): an icon and a title that say why, one sentence on the way forward, and one action. The action is a
 * link when `href` is given ("Open over HTTPS") and otherwise a button that emits `retry` ("Try again"). The icon and
 * the words carry the reason, never the colour alone.
 */
@Component({
  selector: 'wz-connect-blocker',
  imports: [Button],
  templateUrl: './connect-blocker.html',
  styleUrl: './connect-blocker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectBlocker {
  readonly icon = input.required<ConnectBlockerIcon>();
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  /** The words on the action. */
  readonly action = input('Try again');
  /** Where the action goes when it is a link; without it the action is a button. */
  readonly href = input<string | null>(null);
  readonly retry = output();
}

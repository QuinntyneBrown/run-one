import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';

/** The picture before the words: a screen struck out, for another browser, or a padlock, for the secure page. */
export type BrowserNoticeIcon = 'browser' | 'lock';

/**
 * The alert under a screen's header when this browser cannot reach a bike (design-system block browser-notice,
 * docs/mocks/pages/the-class/needs-chromium, link-copied and needs-https; L2-008 AC2, L2-009 AC1): why, in a title and
 * one sentence, and the one action that helps. The rest of the screen stays usable. The action is a primary link when
 * `href` is given ("Open over HTTPS") and otherwise a raised button that emits `act` ("Copy link"); once the button's
 * work is `done` it carries `data-copied` and a check in place of its icon, and the page hands it the words
 * ("Copied"). The words carry the reason; the icon, which a phone leaves out, and the colour only repeat it.
 */
@Component({
  selector: 'wz-browser-notice',
  imports: [Button],
  templateUrl: './browser-notice.html',
  styleUrl: './browser-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserNotice {
  readonly icon = input.required<BrowserNoticeIcon>();
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  /** The words on the action. */
  readonly action = input.required<string>();
  /** Where the action goes when it is a link; without it the action is a button. */
  readonly href = input<string | null>(null);
  /** The button's work is done: it shows a check until the page says otherwise. */
  readonly done = input(false);
  /** The button was pressed. */
  readonly act = output();
}

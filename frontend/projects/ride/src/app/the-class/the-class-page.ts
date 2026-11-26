import { ChangeDetectionStrategy, Component, DOCUMENT, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BLUETOOTH_SUPPORT, type StartAction } from '@telo/api';
import {
  BrowserNotice,
  Button,
  InlineMessage,
  ScreenHeader,
  TheClass,
  TheClassBike,
} from '@telo/components';
import { FullscreenButton } from '../fullscreen/fullscreen-button';
import { browserNotice } from './browser-notice';
import { LinkCopy } from './link-copy';
import { TheClassStore } from './the-class-store';

/**
 * The Class at `/` (docs/mocks/pages/the-class/; L2-084, L2-019, L2-173): the home screen and the one class. Its
 * header has the wordmark, the bike's status as a link to Connect Bike, and Full screen, and no navigation. What the
 * bike will do is part of the view (L2-084 AC2). The start
 * button opens the ride with a connected bike and Connect Bike without one. A class that breaks a rule is not
 * offered: the page says it can't be loaded, with Reload (L2-080 AC3). In a blocked browser an alert under the header
 * says why and what helps, and the start button is disabled (docs/mocks/pages/the-class/needs-chromium, link-copied and
 * needs-https; L2-008 AC2, AC3, L2-009 AC1, L2-010 AC1).
 */
@Component({
  selector: 'wz-the-class-page',
  imports: [
    BrowserNotice,
    Button,
    FullscreenButton,
    InlineMessage,
    RouterLink,
    ScreenHeader,
    TheClass,
    TheClassBike,
  ],
  templateUrl: './the-class-page.html',
  styleUrl: './the-class-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TheClassStore, LinkCopy],
})
export default class TheClassPage {
  protected readonly store = inject(TheClassStore);
  protected readonly support = inject(BLUETOOTH_SUPPORT);
  /** Copy link, on the alert of a browser without Web Bluetooth (L2-008 AC3). */
  protected readonly link = inject(LinkCopy);
  private readonly router = inject(Router);
  private readonly window = inject(DOCUMENT).defaultView;

  /** Why this browser cannot reach a bike, when it cannot: the alert under the header (L2-008 AC2, L2-009 AC1). */
  protected readonly notice = computed(() => browserNotice(this.support.state()));

  /**
   * The start button (L2-084 AC6, AC7): the class ride, which starts at 0:00 at once and is ridden as the rider chose
   * (L2-173 AC5), or Connect Bike when no bike is connected.
   */
  protected start(opens: StartAction['opens']): void {
    void this.router.navigate(opens === 'ride' ? ['/ride'] : ['/connect']);
  }

  /** Reload: the app is read again, from the device or the network, and the class with it (L2-080 AC3). */
  protected reload(): void {
    this.window?.location.reload();
  }
}

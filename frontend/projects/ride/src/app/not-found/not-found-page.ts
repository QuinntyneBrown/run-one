import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, ScreenHeader } from '@telo/components';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/**
 * Page not found (L2-145, docs/mocks/pages/not-found/): any address that matches no screen, under the slim header with
 * the wordmark and Full screen, with one way back to the class.
 */
@Component({
  selector: 'wz-not-found-page',
  imports: [RouterLink, Button, ScreenHeader, FullscreenButton],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotFoundPage {}

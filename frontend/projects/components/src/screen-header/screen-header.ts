import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Lockup } from '../lockup/lockup';

/**
 * The slim header of The Class and Page not found (design-system block class-header): the small
 * lockup, a back link in the `back` slot where the page has one, and the bike's status and the page's actions in the
 * `end` slot, pushed to the end. It has no navigation (L2-167 AC4).
 */
@Component({
  selector: 'wz-screen-header',
  imports: [Lockup],
  templateUrl: './screen-header.html',
  styleUrl: './screen-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenHeader {}

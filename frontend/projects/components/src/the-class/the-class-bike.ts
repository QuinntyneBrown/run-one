import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The bike status in The Class's header (element the-class__bike; L2-019), on the page's link to Connect Bike: the
 * connected bike's name, "connected" for a screen reader and "· Change", or "No bike" and "· Connect" with the
 * Bluetooth-off icon, so colour never carries the state alone. On a phone the action is hidden from sight but still
 * read, and the link stays 44 px tall.
 */
@Component({
  selector: 'a[wz-the-class-bike]',
  templateUrl: './the-class-bike.html',
  styleUrl: './the-class-bike.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'the-class__bike' },
})
export class TheClassBike {
  /** Whether the bike is connected; the link's content is its name, or "No bike". */
  readonly connected = input.required<boolean>();
}

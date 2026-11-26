import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BLUETOOTH_SUPPORT } from '@telo/api';
import {
  Button,
  ConnectBlocker,
  ConnectDevice,
  type ConnectDeviceState,
  ConnectWorks,
  Lockup,
} from '@telo/components';
import { SUPPORTED_BIKES } from '@telo/domain';
import { connectAlert } from './connect-alert';
import { ConnectBikeStore } from './connect-bike-store';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/** The bike the card offers before the search: the model Telo Ride 1 fully controls. */
const OFFERED = 'Echelon EX-5s';

/**
 * Connect Bike at `/connect` (docs/mocks/pages/connect-bike/): pick the bike and pair it, with no app navigation, or
 * say why the bike cannot be reached.
 */
@Component({
  selector: 'wz-connect-bike-page',
  imports: [FullscreenButton, Lockup, Button, ConnectBlocker, ConnectDevice, ConnectWorks],
  templateUrl: './connect-bike-page.html',
  styleUrl: './connect-bike-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConnectBikeStore],
})
export default class ConnectBikePage {
  protected readonly store = inject(ConnectBikeStore);
  protected readonly support = inject(BLUETOOTH_SUPPORT);
  protected readonly bikes = SUPPORTED_BIKES;

  protected readonly device = computed(() => {
    const view = this.store.view();
    const bike = 'bike' in view ? view.bike : null;
    const state: ConnectDeviceState =
      view.kind === 'searching' ? 'searching' : view.kind === 'paired' ? 'paired' : 'idle';
    return { name: bike?.name ?? OFFERED, identifier: bike?.identifier ?? null, state };
  });

  /** Why the bike cannot be reached, when it cannot: the alert that stands in for the card and the pair button. */
  protected readonly alert = computed(() => connectAlert(this.support.state(), this.store.view()));

  protected readonly action = computed(() => {
    switch (this.store.view().kind) {
      case 'default':
        return { label: `Pair ${OFFERED}`, busy: false, disabled: false };
      case 'searching':
        return { label: 'Searching…', busy: false, disabled: true };
      case 'pairing':
        return { label: 'Pairing…', busy: true, disabled: true };
      case 'paired':
        return { label: 'Paired', busy: false, disabled: true };
      case 'failed':
        return { label: `Pair ${OFFERED}`, busy: false, disabled: false };
    }
  });
}

/** The screen the app opens on at `/`. */
export type OpeningScreen = 'connect-bike' | 'the-class';

/**
 * Where the app opens (L2-167): a new rider, with no remembered bike and no finished ride, on Connect Bike (AC1);
 * a rider with either on The Class (AC2). Whether the bike is connected, and whether the browser can reach one,
 * change nothing (AC2, AC3).
 */
export function openingScreen(rider: {
  readonly rememberedBike: boolean;
  readonly finishedRide: boolean;
}): OpeningScreen {
  return rider.rememberedBike || rider.finishedRide ? 'the-class' : 'connect-bike';
}

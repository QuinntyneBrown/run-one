// Unit test
// Traces to: L2-167 AC1, AC2
// Description: a rider with no remembered bike and no finished ride opens on Connect Bike; a remembered bike, a
// finished ride or both open The Class.
import { openingScreen } from './opening-screen';

describe('openingScreen', () => {
  it.each([
    { rememberedBike: false, finishedRide: false, screen: 'connect-bike' },
    { rememberedBike: true, finishedRide: false, screen: 'the-class' },
    { rememberedBike: false, finishedRide: true, screen: 'the-class' },
    { rememberedBike: true, finishedRide: true, screen: 'the-class' },
  ] as const)(
    'remembered bike $rememberedBike, finished ride $finishedRide: $screen',
    ({ rememberedBike, finishedRide, screen }) => {
      expect(openingScreen({ rememberedBike, finishedRide })).toBe(screen);
    },
  );
});

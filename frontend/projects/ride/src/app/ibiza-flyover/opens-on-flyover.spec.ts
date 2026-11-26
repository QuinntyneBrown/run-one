// Unit test
// Traces to: L2-179 AC9
// Description: only a ride in Ibiza on a device that does not ask for reduced motion opens on the flyover.
import { opensOnFlyover } from './opens-on-flyover';

describe('opensOnFlyover', () => {
  it.each([
    ['ibiza', false, true],
    ['ibiza', true, false],
    ['video', false, false],
    ['video', true, false],
  ] as const)('a ride %s with reduced motion %s opens on it: %s', (way, reduced, opens) => {
    expect(opensOnFlyover(way, reduced)).toBe(opens);
  });
});

import { LOWEST_SUN, shadowReach, shadowShade, shadowSun } from './sun-shadow-frame';

describe("where the rider's shadow in the sun lies (L2-174 AC12)", () => {
  it('lies straight away from the sun, whatever its height', () => {
    const sun = shadowSun([0.3988, 0.11, -0.9104]);
    const flat = Math.hypot(0.3988, 0.9104);
    expect(sun.awayX).toBeCloseTo(-0.3988 / flat);
    expect(sun.awayZ).toBeCloseTo(0.9104 / flat);
    expect(Math.hypot(sun.awayX, sun.awayZ)).toBeCloseTo(1);
  });

  it('counts a sun lower than the light that shades the rider as standing as high as it (25.9°)', () => {
    const sun = shadowSun([0.3988, 0.11, -0.9104]);
    expect(sun.altitude).toBeCloseTo(LOWEST_SUN);
    expect((LOWEST_SUN * 180) / Math.PI).toBeCloseTo(25.9, 1);
    expect(sun.y).toBeCloseTo(Math.sin(LOWEST_SUN));
    expect(Math.hypot(sun.x, sun.y, sun.z)).toBeCloseTo(1);
    // Its bearing is still the file's.
    expect(Math.atan2(sun.x, sun.z)).toBeCloseTo(Math.atan2(0.3988, -0.9104));
  });

  it('keeps the height of a sun that stands higher', () => {
    const sun = shadowSun([0, 1, -1]);
    expect(sun.altitude).toBeCloseTo(Math.PI / 4);
    expect(sun.z).toBeCloseTo(-Math.SQRT1_2);
  });

  it('throws the shadow under the rider when the sun is overhead', () => {
    const sun = shadowSun([0, 1, 0]);
    expect(sun.altitude).toBeCloseTo(Math.PI / 2);
    expect(shadowReach(1.65, sun.altitude)).toBeCloseTo(0);
    expect(Math.hypot(sun.awayX, sun.awayZ)).toBeCloseTo(1);
  });

  it('carries the shadow of the rider’s head 3.4 m at the lowest sun', () => {
    expect(shadowReach(1.65, LOWEST_SUN)).toBeCloseTo(3.4, 1);
    expect(shadowReach(1.65, Math.PI / 4)).toBeCloseTo(1.65);
  });

  it('writes into the object it is given, so a frame allocates nothing', () => {
    const into = shadowSun([1, 1, 0]);
    expect(shadowSun([0, 1, -1], into)).toBe(into);
    expect(into.awayZ).toBeCloseTo(1);
  });

  it('leaves the sky’s share of the light in the shadow, so an orange sun throws a cool one', () => {
    const [red, green, blue] = shadowShade([2, 1, 0.5], [1, 1, 1], Math.PI / 6);
    // Half the sun falls on the ground at 30°: red keeps 1 of 2, green 1 of 1.5, blue 1 of 1.25.
    expect(red).toBeCloseTo(0.5);
    expect(green).toBeCloseTo(1 / 1.5);
    expect(blue).toBeCloseTo(0.8);
  });

  it('throws no shadow where there is no sun, and a deeper one when asked', () => {
    expect(shadowShade([0, 0, 0], [1, 1, 1], 1)).toEqual([1, 1, 1]);
    expect(shadowShade([1, 1, 1], [1, 1, 1], Math.PI / 2, 2)[0]).toBeCloseTo(0.25);
  });
});

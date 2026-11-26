// Unit test
// Traces to: L2-183 AC2 to AC4
// Description: the level a segment is sent at for each intensity, and the ride's intensity within 0 to 10.
import { RideIntensity, clampIntensity, intensityLevel } from './intensity';

describe('intensityLevel', () => {
  it('is the plan’s level at 5/10', () => {
    for (const level of [1, 11, 14, 22, 24, 32]) expect(intensityLevel(level, 5)).toBe(level);
  });

  it('scales a level by 10 % a notch, halves up (L2-183 AC3)', () => {
    expect(intensityLevel(22, 6)).toBe(24); // 24.2
    expect(intensityLevel(22, 7)).toBe(26); // 26.4
    expect(intensityLevel(14, 7)).toBe(17); // 16.8
    expect(intensityLevel(19, 7)).toBe(23); // 22.8
    expect(intensityLevel(15, 0)).toBe(8); // 7.5
    expect(intensityLevel(22, 0)).toBe(11);
    expect(intensityLevel(14, 4)).toBe(13); // 12.6
  });

  it('clamps the level to 1 to 32', () => {
    expect(intensityLevel(22, 10)).toBe(32); // 33
    expect(intensityLevel(1, 0)).toBe(1); // 0.5 rounds to 1
    expect(intensityLevel(1, 0.0)).toBeGreaterThanOrEqual(1);
  });
});

describe('RideIntensity', () => {
  it('starts at 5 and moves a notch at a time within 0 to 10 (L2-183 AC2, AC4)', () => {
    const intensity = new RideIntensity();
    expect(intensity.value()).toBe(5);

    expect(intensity.raise()).toBe(true);
    expect(intensity.value()).toBe(6);
    expect(intensity.set(10)).toBe(true);
    expect(intensity.raise()).toBe(false);
    expect(intensity.value()).toBe(10);
    expect(intensity.set(0)).toBe(true);
    expect(intensity.lower()).toBe(false);
    expect(intensity.value()).toBe(0);
  });

  it('starts at the rider’s default, kept whole and in range', () => {
    const intensity = new RideIntensity();
    intensity.start(7);
    expect(intensity.value()).toBe(7);
    intensity.start(14);
    expect(intensity.value()).toBe(10);
  });

  it('keeps an intensity whole', () => {
    expect(clampIntensity(6.4)).toBe(6);
    expect(clampIntensity(-3)).toBe(0);
  });
});

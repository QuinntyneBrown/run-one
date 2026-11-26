// Unit test
// Traces to: L2-184 AC1, AC4; L2-129
// Description: Class Done asks about the ride's intensity only when it is a whole number from 0 to 10 other than the
// kept default.
import { intensityQuestion } from './intensity-question';

describe('intensityQuestion', () => {
  it('asks when the ride ended away from the default (L2-184 AC1)', () => {
    expect(intensityQuestion(7, 5)).toEqual({ intensity: 7, current: 5 });
    expect(intensityQuestion(0, 5)).toEqual({ intensity: 0, current: 5 });
  });

  it('asks nothing at the default (L2-184 AC4)', () => {
    expect(intensityQuestion(5, 5)).toBeNull();
    expect(intensityQuestion(7, 7)).toBeNull();
  });

  it('asks nothing of an intensity it cannot trust (L2-129)', () => {
    for (const value of [undefined, null, '7', 6.5, -1, 11, Number.NaN])
      expect(intensityQuestion(value, 5)).toBeNull();
  });
});

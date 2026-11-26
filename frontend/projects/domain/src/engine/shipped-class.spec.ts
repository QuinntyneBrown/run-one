// Unit test
// Traces to: L2-080 AC1, AC3
// Description: the class the app ships with is answered as it is; a class that breaks a rule is refused with an error
// whose code is `class_invalid`, so it is never offered.
import { ClassError } from '@telo/api';
import { INTERVALS_TO_THE_BEAT } from './intervals-to-the-beat';
import { shippedClass } from './shipped-class';

describe('shippedClass', () => {
  it('answers Intervals to the Beat', () => {
    expect(shippedClass().get()).toBe(INTERVALS_TO_THE_BEAT);
  });

  it('refuses a class that breaks a rule, naming the rule', () => {
    const broken = { ...INTERVALS_TO_THE_BEAT, lengthSeconds: 1800 };
    let refusal: unknown;
    try {
      shippedClass(broken).get();
    } catch (error) {
      refusal = error;
    }
    expect(refusal).toBeInstanceOf(ClassError);
    expect((refusal as ClassError).code).toBe('class_invalid');
    expect((refusal as ClassError).message).toContain('length');
  });
});

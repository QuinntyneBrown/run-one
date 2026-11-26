import { readCourseProbe } from './course-probe';

describe('readCourseProbe (the test-only hook)', () => {
  it.each(['low', 'medium', 'high', 'ultra'] as const)('pins %s', (tier) => {
    expect(readCourseProbe({ tier })).toEqual({ tier, forceWebGL: false });
  });

  it('forces the WebGL 2 backend when asked', () => {
    expect(readCourseProbe({ tier: 'high', backend: 'webgl2' })).toEqual({
      tier: 'high',
      forceWebGL: true,
    });
  });

  it.each([
    ['nothing set', undefined],
    ['null', null],
    ['a string', 'low'],
    ['an unknown tier', { tier: 'max' }],
    ['no tier', {}],
  ])('is off with %s', (_, value) => {
    expect(readCourseProbe(value)).toBeNull();
  });
});

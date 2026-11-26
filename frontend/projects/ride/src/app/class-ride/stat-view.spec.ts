// Unit test
// Traces to: L2-089 AC2, AC3, AC6; L2-023 AC2
// Description: what Power and Cadence read in the bike panel, one case per row. Power is "On target" within 10 % of
// the segment's target power, both edges included, and otherwise the signed difference in watts; the words carry it
// and the tone only colours them. With no power or no target there is no line under the number.
import { cadenceStat, powerStat } from './stat-view';

describe('powerStat', () => {
  // The second recovery of Intervals to the Beat: 90 rpm at level 13, 231 W. 10 % of it is 23.1 W.
  it.each([
    { power: 233, hint: 'On target', tone: 'on' },
    { power: 231, hint: 'On target', tone: 'on' },
    { power: 254, hint: 'On target', tone: 'on' },
    { power: 255, hint: '+24 W', tone: 'over' },
    { power: 269, hint: '+38 W', tone: 'over' },
    { power: 208, hint: 'On target', tone: 'on' },
    { power: 207, hint: '-24 W', tone: 'under' },
    { power: 192, hint: '-39 W', tone: 'under' },
    { power: 0, hint: '-231 W', tone: 'under' },
  ] as const)('$power W against 231 W reads "$hint"', ({ power, hint, tone }) => {
    expect(powerStat(power, 231)).toEqual({ value: String(power), hint, tone });
  });

  it('measures the edge against the target itself: 10 % of 100 W is 10 W either way', () => {
    expect(powerStat(110, 100).hint).toBe('On target');
    expect(powerStat(111, 100).hint).toBe('+11 W');
    expect(powerStat(90, 100).hint).toBe('On target');
    expect(powerStat(89, 100).hint).toBe('-11 W');
  });

  it('rounds the bike’s power to a whole watt before comparing', () => {
    expect(powerStat(254.4, 231)).toEqual({ value: '254', hint: 'On target', tone: 'on' });
    expect(powerStat(254.6, 231)).toEqual({ value: '255', hint: '+24 W', tone: 'over' });
  });

  it('has no line under the number when the segment has no target', () => {
    expect(powerStat(233, null)).toEqual({ value: '233', hint: null, tone: null });
  });

  it('reads a dash with no line under it while the power is unknown (L2-023 AC2)', () => {
    expect(powerStat(null, 231)).toEqual({ value: '—', hint: null, tone: null });
    expect(powerStat(null, null)).toEqual({ value: '—', hint: null, tone: null });
  });
});

describe('cadenceStat', () => {
  it('reads the cadence with the segment’s aim (L2-089 AC3)', () => {
    expect(cadenceStat(91, 90)).toEqual({ value: '91', hint: 'Aim 90', tone: null });
  });

  it('keeps the aim while the cadence is unknown', () => {
    expect(cadenceStat(null, 90)).toEqual({ value: '—', hint: 'Aim 90', tone: null });
  });

  it('shows no aim for a segment without one, or before the plan has a segment', () => {
    expect(cadenceStat(91, null)).toEqual({ value: '91', hint: null, tone: null });
    expect(cadenceStat(91, undefined)).toEqual({ value: '91', hint: null, tone: null });
  });
});

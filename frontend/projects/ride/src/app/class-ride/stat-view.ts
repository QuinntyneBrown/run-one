import { type ClassStatTone, formatMetric } from '@telo/components';
import { PowerModel } from '@telo/domain';

/** A live stat as the bike panel shows it: the number, the line under it and how that line reads against its target. */
export interface StatView {
  readonly value: string;
  readonly hint: string | null;
  readonly tone: ClassStatTone | null;
}

/**
 * Power against the segment's target power (L2-089 AC2): "On target" within 10 % of it, otherwise the signed
 * difference in whole watts ("-39 W", "+38 W"). The words carry it; the tone only colours them (AC6). With no power
 * yet, or no target, there is no line under the number, and unknown power reads "—" (L2-023 AC2).
 */
export function powerStat(power: number | null, target: number | null): StatView {
  if (power === null || target === null)
    return { value: formatMetric(power, 0), hint: null, tone: null };
  const watts = Math.round(power);
  if (PowerModel.onTarget(watts, target))
    return { value: String(watts), hint: 'On target', tone: 'on' };
  const delta = watts - target;
  return {
    value: String(watts),
    hint: `${delta > 0 ? '+' : '-'}${Math.abs(delta)} W`,
    tone: delta > 0 ? 'over' : 'under',
  };
}

/** Cadence with the segment's cadence aim (L2-089 AC3): "Aim 90", or no line for a segment without an aim. */
export function cadenceStat(cadence: number | null, aim: number | null | undefined): StatView {
  return {
    value: formatMetric(cadence, 0),
    hint: aim === null || aim === undefined ? null : `Aim ${aim}`,
    tone: null,
  };
}

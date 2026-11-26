import type { ClassDefinition } from '@telo/api';
import { MAX_RESISTANCE, MIN_RESISTANCE } from '../protocol/echelon-protocol';

/** The rule a class breaks: a level, a cadence aim, the count of efforts or the length. */
export type BrokenClassRule = 'level' | 'cadence_aim' | 'efforts' | 'length';

/** The class has 17 efforts (L2-080 AC3). */
const EFFORTS = 17;

const whole = (value: number, from: number): boolean => Number.isInteger(value) && value >= from;

/**
 * The rules a class's plan must meet before it is offered (L2-080 AC3): every level is 1 to 32, every segment has a
 * cadence aim, there are exactly 17 work segments, and the segments, each at least a second long, add up to the
 * class's length. `broken` names the first rule a class breaks, in that order, or `null` for a class that breaks none.
 */
export const ClassRule = {
  broken(definition: ClassDefinition): BrokenClassRule | null {
    const { segments } = definition.plan;
    if (segments.some(({ level }) => !whole(level, MIN_RESISTANCE) || level > MAX_RESISTANCE))
      return 'level';
    if (segments.some(({ cadenceAim }) => !whole(cadenceAim, 1))) return 'cadence_aim';
    if (segments.filter(({ kind }) => kind === 'work').length !== EFFORTS) return 'efforts';
    const length = segments.reduce((total, { duration }) => total + duration, 0);
    if (segments.some(({ duration }) => !whole(duration, 1)) || length !== definition.lengthSeconds)
      return 'length';
    return null;
  },
} as const;

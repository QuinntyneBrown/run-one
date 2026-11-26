/** What Class Done asks about the ride's intensity: the ride's, and the default it would replace (L2-184 AC1). */
export interface IntensityQuestionView {
  readonly intensity: number;
  readonly current: number;
}

/**
 * Whether Class Done asks to keep the ride's intensity: only when the result carries a whole intensity from 0 to 10
 * (it comes from the history state, untrusted, L2-129) that differs from the kept default (L2-184 AC1, AC4).
 */
export function intensityQuestion(intensity: unknown, kept: number): IntensityQuestionView | null {
  if (typeof intensity !== 'number' || !Number.isInteger(intensity)) return null;
  if (intensity < 0 || intensity > 10 || intensity === kept) return null;
  return { intensity, current: kept };
}

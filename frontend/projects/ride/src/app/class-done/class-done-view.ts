import type { ClassResult, EffortBar } from '@telo/api';

/** Class Done as the screen draws it (docs/mocks/pages/class-done/). */
export interface ClassDoneView {
  /** "Intervals to the Beat". */
  readonly title: string;
  /** The output as a whole number of kJ ("351"; L2-078 AC4). */
  readonly output: string;
  /** The ride's running time ("20:00"). */
  readonly time: string;
  /** The average watts as a whole number ("293"). */
  readonly average: string;
  /** The share of running seconds on target as a whole percentage ("84%"; L2-170 AC2). */
  readonly onTarget: string;
  /** The `h1` (L2-077): "New best output", "Your best is still 342 kJ" or "Class done. That’s your number to beat." */
  readonly verdict: string;
  /** Whether this ride beat the best: the output and the verdict are gold, and the words carry it (L2-077 AC4). */
  readonly best: boolean;
  /** "Previous best" or "Best" with a whole kJ; none for the first ride. */
  readonly bestFact: { readonly label: string; readonly value: string } | null;
  /** `false` when the ride could not be saved on this device: a notice says so (L2-168 AC4). */
  readonly saved: boolean;
  /** The class's efforts in plan order, each a bar (L2-169). */
  readonly efforts: readonly EffortBar[];
  /** What a screen reader hears as Class Done opens (L2-141 AC2): "New best output. 351 kJ in 20:00." */
  readonly announcement: string;
}

/** Whole seconds as "0:57", "26:38" or, from an hour, "1:02:03". */
function clock(seconds: number): string {
  const s = String(seconds % 60).padStart(2, '0');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}:${s}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${s}`;
}

/**
 * Class Done from the result the ride hands over (L2-078): the output in whole kJ (AC4), the running time, and the
 * average watts, round(output in kJ × 1000 ÷ running seconds) (AC3), 0 for a ride of no seconds. The verdict compares
 * the whole-kJ output with the best before the ride (L2-077): higher is a new best, otherwise the best stands, and
 * the first ride has none to compare with.
 */
export function classDoneView(result: ClassResult): ClassDoneView {
  const kj = Math.round(result.outputKj);
  const output = String(kj);
  const previous = result.previousBestKj;
  const best = previous !== null && kj > previous;
  const verdict =
    previous === null
      ? 'Class done. That’s your number to beat.'
      : best
        ? 'New best output'
        : `Your best is still ${previous} kJ`;
  const time = clock(result.elapsedSeconds);
  const average =
    result.elapsedSeconds > 0 ? Math.round((result.outputKj * 1000) / result.elapsedSeconds) : 0;
  return {
    title: result.title,
    output,
    time,
    average: String(average),
    onTarget: `${Math.round(result.onTargetShare * 100)}%`,
    verdict,
    best,
    bestFact:
      previous === null
        ? null
        : { label: best ? 'Previous best' : 'Best', value: `${previous} kJ` },
    saved: result.saved,
    efforts: effortBars(result.efforts),
    announcement: `${verdict.replace(/\.$/, '')}. ${output} kJ in ${time}.`,
  };
}

/**
 * The efforts as bars (L2-169): each bar's height is its watts as a share of the strongest effort's, the strongest
 * is full height and the one set apart (the earliest where they tie), and when every effort is 0 W none is.
 */
function effortBars(watts: readonly number[]): EffortBar[] {
  const peak = Math.max(0, ...watts);
  const strongest = peak > 0 ? watts.indexOf(peak) : -1;
  return watts.map((value, index) => ({
    number: index + 1,
    watts: value,
    height: peak > 0 ? Math.round((value / peak) * 1000) / 10 : 0,
    strongest: index === strongest,
  }));
}

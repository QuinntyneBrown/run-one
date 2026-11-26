/**
 * A ride's record from its start to its finish, for its result (L2-078 AC1). For each second ridden it adds the power
 * to the output; seconds a hidden tab skipped count at the power of the moment, and an unknown power counts as none.
 * It counts the seconds whose power was within 10 % of the target (L2-037 AC3) for the share on target. It holds three
 * numbers however long the ride, and nothing is counted past four hours. The record stays on the device: Telo Ride 1
 * sends a finished ride nowhere (ADR 0039).
 */
export class RideRecorder {
  static readonly maxSeconds = 14_400;

  private seconds = 0;
  private joules = 0;
  private onTargetSeconds = 0;

  /** `seconds` seconds ridden at `powerW`, on target when that power was within 10 % of the target. */
  record(powerW: number | null, seconds = 1, onTarget = false): void {
    const kept = Math.min(seconds, RideRecorder.maxSeconds - this.seconds);
    if (kept <= 0) return;
    this.seconds += kept;
    if (onTarget) this.onTargetSeconds += kept;
    this.joules += (powerW ?? 0) * kept;
  }

  /** The whole seconds ridden. */
  get elapsedSeconds(): number {
    return this.seconds;
  }

  /** The output so far in kJ, the sum of each second's power ÷ 1000 (L2-023 AC5), to the joule. */
  get outputKj(): number {
    return Math.round(this.joules) / 1000;
  }

  /** The share of seconds ridden on target, from 0 to 1, to three decimals; 0 before a second is ridden. */
  get onTargetShare(): number {
    return this.seconds === 0 ? 0 : Math.round((this.onTargetSeconds / this.seconds) * 1000) / 1000;
  }
}

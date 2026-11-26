/**
 * What the countdown shows at one moment (L2-180 AC2): the numeral, how many of its three lights are lit, whether it is
 * "Go!", and whether the countdown is over and goes. A pure function of the time since it started, so a hidden tab
 * cannot stretch it (docs/detailed-designs/class-ride/count-down-to-the-start).
 */
export interface CountdownStep {
  readonly numeral: '3' | '2' | '1' | 'Go!';
  /** The lights lit: none on "3", one on "2", two on "1" and all three on "Go!". */
  readonly lit: 0 | 1 | 2 | 3;
  /** Whether the numeral is "Go!": the ride clock has started. */
  readonly go: boolean;
  /** Whether "Go!" has shown for its 0.7 seconds and the countdown goes. */
  readonly over: boolean;
}

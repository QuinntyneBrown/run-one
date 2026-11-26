/** One effort of the class as Class Done draws it (L2-169): its number, its watts and its bar. */
export interface EffortBar {
  /** From 1, in plan order. */
  readonly number: number;
  readonly watts: number;
  /** The bar's height as a percent of the strongest effort's; 0 for every effort when all are 0 W. */
  readonly height: number;
  /** The strongest effort, the earliest where they tie; none when every effort is 0 W. */
  readonly strongest: boolean;
}

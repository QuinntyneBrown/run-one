// Unit test
// Traces to: L2-177 AC3
// Description: the course is judged on 90 frames at a time against the display's frame period: an average within 1.1
// of it steps up a step of the five, an average over 1.6 of it steps down (to the lowest at the least) and never up
// again, and anything between holds. A step is taken once per 90 frames.
import { FrameBudget } from './frame-budget';

const PERIOD = 16;

/** Judges `frames` frames of `cost` ms each, and returns each step the budget took. */
function run(budget: FrameBudget, frames: number, cost: number): number[] {
  const steps: number[] = [];
  for (let frame = 0; frame < frames; frame++) {
    const step = budget.frame(cost, PERIOD);
    if (step !== 0) steps.push(step);
  }
  return steps;
}

describe('FrameBudget', () => {
  it('starts on the step it is given, and takes no step before 90 frames', () => {
    const budget = new FrameBudget(5, 1);
    expect(budget.tier).toBe(1);
    expect(run(budget, 89, PERIOD)).toEqual([]);
    expect(budget.tier).toBe(1);
  });

  it('steps up through the five while frames keep the display’s pace, and stops at the highest', () => {
    const budget = new FrameBudget(5, 1);
    expect(run(budget, 90 * 6, PERIOD)).toEqual([1, 1, 1]);
    expect(budget.tier).toBe(4);
  });

  it('steps up at an average of 1.1 of the period, and holds above it', () => {
    expect(run(new FrameBudget(5, 1), 90, PERIOD * 1.1)).toEqual([1]);
    expect(run(new FrameBudget(5, 1), 90, PERIOD * 1.2)).toEqual([]);
  });

  it('holds between 1.1 and 1.6 of the period', () => {
    const budget = new FrameBudget(5, 2);
    expect(run(budget, 90 * 3, PERIOD * 1.5)).toEqual([]);
    expect(budget.tier).toBe(2);
  });

  it('steps down over 1.6 of the period, to the lowest at the least, and steps up no more', () => {
    const budget = new FrameBudget(5, 1);
    expect(run(budget, 90 * 3, PERIOD * 1.7)).toEqual([-1]);
    expect(budget.tier).toBe(0);
    expect(run(budget, 90 * 3, PERIOD)).toEqual([]);
    expect(budget.tier).toBe(0);
  });

  it('judges the average of the 90, not any one frame', () => {
    const budget = new FrameBudget(5, 1);
    const steps: number[] = [];
    for (let frame = 0; frame < 90; frame++) {
      const step = budget.frame(frame === 0 ? 400 : 10, PERIOD);
      if (step !== 0) steps.push(step);
    }
    // One 400 ms frame among 89 of 10 ms averages 14.3 ms: within 1.1 of the period.
    expect(steps).toEqual([1]);
  });

  it('starts again at 90 frames when told, as a new display period does', () => {
    const budget = new FrameBudget(5, 1);
    run(budget, 80, PERIOD * 2);
    budget.restart();
    expect(run(budget, 89, PERIOD * 2)).toEqual([]);
  });
});

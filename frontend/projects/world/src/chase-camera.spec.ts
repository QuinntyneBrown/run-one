import { chaseCamera } from './chase-camera';

/** A course whose finish line stands 8,434 m from the grid, as Ibiza Sunset Strip's does. */
const FINISH = 8434;

describe('where the chase camera sits (L2-174 AC10)', () => {
  it.each([
    ['in the middle of the course', 4000, 2.75, 1.8],
    ['45 m past the grid, where the closing in ends', 45, 2.75, 1.8],
    ['just beyond 45 m of the grid', 45.5, 2.75, 1.8],
    ['45 m before the grid', -45, 2.75, 1.8],
    ['70 m before the finish line, where the closing in starts', FINISH - 70, 2.75, 1.8],
    ['just outside 70 m of the finish line', FINISH - 70.5, 2.75, 1.8],
    ['70 m past the finish line, down the run-out', FINISH + 70, 2.75, 1.8],
  ])('%s it sits 2.75 m behind and 1.8 m above the rider', (_, metres, behind, above) => {
    expect(chaseCamera(metres, FINISH)).toEqual({ behind, above });
  });

  it.each([
    ['on the grid', 0],
    ['on the finish line', FINISH],
  ])('%s it has closed in to 2.4 m behind and 1.65 m above', (_, metres) => {
    const camera = chaseCamera(metres, FINISH);
    expect(camera.behind).toBeCloseTo(2.4);
    expect(camera.above).toBeCloseTo(1.65);
  });

  it.each([
    ['44 m past the grid', 44],
    ['44 m before the grid', -44],
    ['69 m before the finish line', FINISH - 69],
    ['69 m past the finish line', FINISH + 69],
  ])('%s it has started to close in', (_, metres) => {
    const camera = chaseCamera(metres, FINISH);
    expect(camera.behind).toBeLessThan(2.75);
    expect(camera.behind).toBeGreaterThan(2.4);
    expect(camera.above).toBeLessThan(1.8);
    expect(camera.above).toBeGreaterThan(1.65);
  });

  it.each([
    ['22.5 m from the grid', 22.5],
    ['35 m from the finish line', FINISH - 35],
  ])('%s it is half way in: the move is eased, with no step at either end', (_, metres) => {
    const camera = chaseCamera(metres, FINISH);
    expect(camera.behind).toBeCloseTo(2.575);
    expect(camera.above).toBeCloseTo(1.725);
  });

  it('closes in further the nearer the line', () => {
    const behind = [40, 30, 20, 10, 0].map((metres) => chaseCamera(metres, FINISH).behind);
    expect([...behind].sort((a, b) => b - a)).toEqual(behind);
    expect(new Set(behind).size).toBe(5);
  });

  it('writes into the object it is given, so a frame allocates nothing', () => {
    const into = { behind: 0, above: 0 };
    expect(chaseCamera(0, FINISH, into)).toBe(into);
    expect(into.behind).toBeCloseTo(2.4);
  });
});

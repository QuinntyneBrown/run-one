// Unit test
// Traces to: L2-173 AC1, AC2, AC6
// Description: the class is ridden the way the rider kept; with its video for a rider who has never chosen, and with
// its video whatever was kept in a browser that cannot draw the course.
import { rideWith } from './ride-with';

describe('rideWith', () => {
  it.each([
    { kept: null, drawable: true, way: 'video' },
    { kept: 'video', drawable: true, way: 'video' },
    { kept: 'ibiza', drawable: true, way: 'ibiza' },
    { kept: null, drawable: false, way: 'video' },
    { kept: 'video', drawable: false, way: 'video' },
    { kept: 'ibiza', drawable: false, way: 'video' },
  ] as const)('kept $kept, drawable $drawable: $way', ({ kept, drawable, way }) => {
    expect(rideWith(kept, drawable)).toBe(way);
  });
});

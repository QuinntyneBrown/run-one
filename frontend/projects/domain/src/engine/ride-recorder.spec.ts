// Unit test
// Traces to: L2-078 AC1; L2-037 AC3; L2-023 AC5
// Description: a ride's recorder adds each second's power to the output. Seconds a hidden tab skipped count at the
// power of the moment, an unknown power counts as none, and nothing is counted past four hours. The share of seconds
// on target is kept to three decimals.
import { RideRecorder } from './ride-recorder';

describe('RideRecorder', () => {
  it('adds each second’s power to the output', () => {
    const recorder = new RideRecorder();
    recorder.record(200);
    recorder.record(250.4);
    recorder.record(180);

    expect(recorder.elapsedSeconds).toBe(3);
    expect(recorder.outputKj).toBeCloseTo(0.63, 3);
  });

  it('counts the seconds a hidden tab skipped at the power of the moment', () => {
    const recorder = new RideRecorder();
    recorder.record(300, 4);

    expect(recorder.elapsedSeconds).toBe(4);
    expect(recorder.outputKj).toBe(1.2);
  });

  it('counts an unknown power as none', () => {
    const recorder = new RideRecorder();
    recorder.record(null, 2);

    expect(recorder.elapsedSeconds).toBe(2);
    expect(recorder.outputKj).toBe(0);
  });

  it('keeps the share of seconds whose power was on target', () => {
    const recorder = new RideRecorder();
    recorder.record(143, 40, true);
    recorder.record(661, 33, false);

    expect(recorder.onTargetShare).toBe(0.548);
  });

  it('has no share on target before a second is ridden', () => {
    expect(new RideRecorder().onTargetShare).toBe(0);
  });

  it('counts nothing past four hours', () => {
    const recorder = new RideRecorder();
    recorder.record(200, RideRecorder.maxSeconds + 60);

    expect(recorder.elapsedSeconds).toBe(RideRecorder.maxSeconds);
    expect(recorder.outputKj).toBe((200 * RideRecorder.maxSeconds) / 1000);
  });

  it('holds the same three numbers after four hours as after a second, and no trace (L2-138 AC2)', () => {
    const recorder = new RideRecorder();
    recorder.record(200, 1, true);
    const shape = (): string[] => Object.keys(recorder).sort();
    const before = shape();
    for (let second = 0; second < RideRecorder.maxSeconds; second++)
      recorder.record(200 + (second % 50), 1, second % 2 === 0);

    expect(shape()).toEqual(before);
    expect(before).toHaveLength(3);
    for (const value of Object.values(recorder)) expect(typeof value).toBe('number');
  });
});

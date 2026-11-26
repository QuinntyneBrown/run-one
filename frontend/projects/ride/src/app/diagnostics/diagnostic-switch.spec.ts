// Unit test
// Traces to: L2-178 AC1, AC2
// Description: the recording is switched on by `diagnose` in the address's query and by nothing else, one case a row.
import { diagnosticsRequested } from './diagnostic-switch';

describe('diagnosticsRequested', () => {
  it.each([
    ['', false],
    ['?', false],
    ['?simulate', false],
    ['?diagnostics', false],
    ['?x=diagnose', false],
    ['?diagnose', true],
    ['?diagnose=', true],
    ['?diagnose=1', true],
    ['?simulate&diagnose', true],
  ])('%j: %s', (search, on) => {
    expect(diagnosticsRequested(search)).toBe(on);
  });
});

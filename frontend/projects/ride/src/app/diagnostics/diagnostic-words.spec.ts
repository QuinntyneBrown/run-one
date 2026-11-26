// Unit test
// Traces to: L2-178 AC2, AC13, AC15
// Description: the words the dialog says of a save and a capture, and the screen the recording mark is on, one case a
// row.
import { captureKept, filesSaved, screenAt } from './diagnostic-words';

describe('filesSaved', () => {
  it.each([
    [1, 'Saved 1 file: the recording.'],
    [2, 'Saved 2 files: the recording and 1 screen capture.'],
    [3, 'Saved 3 files: the recording and 2 screen captures.'],
    [9, 'Saved 9 files: the recording and 8 screen captures.'],
  ])('%d: %s', (files, text) => {
    expect(filesSaved(files)).toEqual({ text, tone: 'ok' });
  });
});

describe('captureKept', () => {
  it('names the capture by its number', () => {
    expect(captureKept(3)).toEqual({ text: 'Screen capture 3 kept', tone: 'ok' });
  });
});

describe('screenAt', () => {
  it.each([
    ['/', 'the-class'],
    ['/?diagnose', 'the-class'],
    ['/#main', 'the-class'],
    ['/ride', 'class-ride'],
    ['/ride?diagnose', 'class-ride'],
    ['/connect', null],
    ['/connect?diagnose', null],
    ['/done', null],
    ['/no-such-address', null],
  ])('%s: %s', (url, screen) => {
    expect(screenAt(url)).toBe(screen);
  });
});

// Unit test
// Traces to: L2-178 AC15, AC20
// Description: saving presses a link that downloads the file under its name and revokes the object URL at once, so
// nothing stays held; a browser that cannot make the URL refuses with a FileSaveError and still holds nothing.
import { TestBed } from '@angular/core/testing';
import { FileSaveError } from '@telo/api';
import { BrowserFileSaver } from './browser-file-saver';

describe('BrowserFileSaver', () => {
  const file = { name: 'telo-ride-1-recording-20261123T180000Z.log', blob: new Blob(['x']) };
  const saver = () => {
    TestBed.configureTestingModule({ providers: [BrowserFileSaver] });
    return TestBed.inject(BrowserFileSaver);
  };
  afterEach(() => vi.restoreAllMocks());

  it('presses a download link for the file and revokes its object URL', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:telo/1');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const pressed: { href: string; download: string }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      pressed.push({ href: this.href, download: this.download });
    });

    saver().save(file);

    expect(create).toHaveBeenCalledExactlyOnceWith(file.blob);
    expect(pressed).toEqual([{ href: 'blob:telo/1', download: file.name }]);
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:telo/1');
  });

  it('refuses with a FileSaveError when the browser cannot save, and holds no URL', () => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new TypeError('no blob URLs');
    });
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    expect(() => saver().save(file)).toThrow(FileSaveError);
    expect(revoke).not.toHaveBeenCalled();
  });

  it('revokes the object URL when the press fails', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:telo/2');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => saver().save(file)).toThrow(FileSaveError);
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:telo/2');
  });
});

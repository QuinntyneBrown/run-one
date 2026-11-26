import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { CourseGraphics } from '@telo/api';

/**
 * Whether this browser can draw the course (L2-173 AC6): it has WebGPU, or else gives a WebGL 2 context. The context
 * asked for is let go at once, and the answer is kept, so the browser is asked once.
 */
@Injectable()
export class BrowserCourseGraphics implements CourseGraphics {
  private readonly document = inject(DOCUMENT);
  private answer: boolean | null = null;

  available(): boolean {
    return (this.answer ??= this.ask());
  }

  private ask(): boolean {
    const navigator = this.document.defaultView?.navigator as
      (Navigator & { gpu?: unknown }) | undefined;
    if (navigator?.gpu) return true;
    try {
      const gl = this.document.createElement('canvas').getContext('webgl2');
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return gl !== null;
    } catch {
      return false;
    }
  }
}

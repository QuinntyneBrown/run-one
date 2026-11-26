import type { Page } from '@playwright/test';

/**
 * Records the JavaScript a page downloads, to tell whether the 3D world's code has arrived: Three.js's core marks every
 * scene `isScene`, a property name the production build's minifier keeps.
 */
export class ScriptLog {
  private readonly bodies: Promise<string>[] = [];

  constructor(page: Page) {
    page.on('response', (response) => {
      if (response.request().resourceType() === 'script')
        this.bodies.push(response.text().catch(() => ''));
    });
  }

  /** Whether any script downloaded so far carries the video player's code (its embed host's name). */
  async hasVideoPlayerCode(): Promise<boolean> {
    return (await Promise.all(this.bodies)).some((body) => body.includes('youtube-nocookie.com'));
  }

  /** Whether any script downloaded so far carries the diagnostic recording's code (its saved file's first line). */
  async hasRecordingCode(): Promise<boolean> {
    return (await Promise.all(this.bodies)).some((body) =>
      body.includes('Telo Ride 1 diagnostic recording'),
    );
  }

  /** Whether any script downloaded so far carries Three.js. */
  async hasWorldCode(): Promise<boolean> {
    return (await Promise.all(this.bodies)).some((body) => body.includes('isScene'));
  }
}

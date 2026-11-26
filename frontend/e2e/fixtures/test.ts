import { test as base, expect } from '@playwright/test';
import { ApiFixture } from './api';
import { ClipboardFixture } from './clipboard';
import { ContentSecurityPolicyFixture } from './content-security-policy';
import { FakeBluetooth } from './fake-bluetooth';
import { WakeLockFixture } from './wake-lock';
import { FakeWebGl } from './webgl';
import { CourseProbe } from './course-probe';
import { YouTubeFixture } from './youtube';

interface Fixtures {
  /** The fake `navigator.bluetooth`; a spec offers a bike, reads the writes and pushes notifications. */
  bluetooth: FakeBluetooth;
  /** The answers to a request to an API; the app makes none (ADR 0043), and one no answer matches fails the spec. */
  api: ApiFixture;
  /** The YouTube IFrame API and the class covers, answered by a fake player and a local picture. */
  youtube: YouTubeFixture;
  /** The Content Security Policy's refusals in the page; any the spec does not take fails it. */
  policy: ContentSecurityPolicyFixture;
  /** The fake Screen Wake Lock API: the locks the app took, and the tab hidden or shown. */
  wakeLock: WakeLockFixture;
  /** Takes WebGPU, or WebGPU and WebGL, away from the browser before the app loads. */
  webgl: FakeWebGl;
  /** The fake `navigator.clipboard`: the texts the page copied, and a browser that refuses to copy. */
  clipboard: ClipboardFixture;
  /** The test-only hook into the course's renderer: pins the step it draws at and reads what it drew. */
  course: CourseProbe;
  guard: void;
}

/**
 * The shared fixture every spec imports (AGENTS.md, E2E; L2-148 AC1). It installs the fake Bluetooth stack and Screen Wake Lock API before
 * the app loads and answers a request to an API as the spec declares. It fails the spec on a page error, a request
 * off localhost (YouTube's player script and covers excepted, which a fake answers), an unanswered request to an API, a Content Security Policy
 * refusal, or a Bluetooth call the spec did not expect.
 */
export const test = base.extend<Fixtures>({
  bluetooth: async ({ page }, use) => {
    await use(await FakeBluetooth.install(page));
  },
  api: async ({ page }, use) => {
    await use(await ApiFixture.install(page));
  },
  youtube: async ({ page }, use) => {
    await use(await YouTubeFixture.install(page));
  },
  policy: async ({ page }, use) => {
    await use(await ContentSecurityPolicyFixture.install(page));
  },
  webgl: async ({ page }, use) => {
    await use(new FakeWebGl(page));
  },
  clipboard: async ({ page }, use) => {
    await use(await ClipboardFixture.install(page));
  },
  course: async ({ page }, use) => {
    await use(new CourseProbe(page));
  },
  wakeLock: [
    async ({ page }, use) => {
      await use(await WakeLockFixture.install(page));
    },
    { auto: true },
  ],
  guard: [
    async ({ page, bluetooth, api, youtube, policy }, use) => {
      // Installed first, so this catch-all, registered after them, can hand their requests back.
      void youtube;
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
      // On the context, so a request the app's service worker makes off localhost is caught as the page's is.
      await page.context().route(
        (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
        async (route) => {
          const url = new URL(route.request().url());
          if (YouTubeFixture.answers(url)) return route.fallback();
          problems.push(`request off localhost: ${route.request().url()}`);
          await route.abort();
        },
      );
      await use();
      problems.push(...api.unanswered().map((request) => `unanswered request: ${request}`));
      problems.push(...policy.untaken().map((refusal) => `policy refusal: ${refusal}`));
      problems.push(...bluetooth.unexpected().map((call) => `unexpected Bluetooth call: ${call}`));
      expect(
        problems,
        'unexpected page errors, requests, policy refusals or Bluetooth calls',
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
